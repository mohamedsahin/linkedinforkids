import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * Year-in-review report. Returns a print-friendly HTML page that the browser
 * can render and the user can "Save as PDF" from. Authorization: admins can
 * fetch any child; parents only their linked children; children only
 * themselves.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    const user = await requireUser();
    const { childId } = await context.params;

    if (user.role === UserRole.CHILD && user.id !== childId) {
      return new Response("Forbidden", { status: 403 });
    }
    if (user.role === UserRole.PARENT) {
      const link = await prisma.parentChild.findFirst({
        where: { parentId: user.id, childId },
      });
      if (!link) return new Response("Forbidden", { status: 403 });
    }

    const url = new URL(request.url);
    const range = url.searchParams.get("range") ?? "school-2025";

    const dateFilter = buildDateFilter(range);

    const child = await prisma.user.findUnique({
      where: { id: childId },
      include: {
        childProfile: true,
        achievements: {
          where: { isApproved: true, ...dateFilter },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!child || child.role !== UserRole.CHILD) {
      return new Response("Not found", { status: 404 });
    }

    const html = renderHtml({
      child: { fullName: child.fullName, profile: child.childProfile },
      achievements: child.achievements,
      range,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("Report render failed", error);
    return new Response("Unable to render report", { status: 500 });
  }
}

function buildDateFilter(range: string) {
  if (range === "all") return {};
  if (range === "calendar-2025") {
    return { createdAt: { gte: new Date("2025-01-01"), lt: new Date("2026-01-01") } };
  }
  // default: school year (Sep through Aug)
  return { createdAt: { gte: new Date("2025-09-01"), lt: new Date("2026-09-01") } };
}

type ReportChild = { fullName: string; profile: { age?: number; grade?: string | null; school?: string; bio?: string } | null };
type ReportAchievement = { id: string; title: string; description: string | null; category: string; createdAt: Date };

const RANGE_LABELS: Record<string, string> = {
  "school-2025": "2025 — 2026 school year",
  "calendar-2025": "Calendar 2025",
  "all": "All-time portfolio",
};

const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: "Sport", ACADEMICS: "Academics", ARTS: "Arts",
  CODING: "Coding", MUSIC: "Music", OTHER: "Other",
};

function renderHtml({
  child, achievements, range,
}: {
  child: ReportChild;
  achievements: ReportAchievement[];
  range: string;
}) {
  const grouped = new Map<string, ReportAchievement[]>();
  for (const a of achievements) {
    const list = grouped.get(a.category) ?? [];
    list.push(a);
    grouped.set(a.category, list);
  }
  const orderedCategories = ["SPORTS", "ACADEMICS", "ARTS", "CODING", "MUSIC", "OTHER"]
    .filter((c) => grouped.has(c));

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  const sectionHtml = orderedCategories.map((cat) => {
    const items = grouped.get(cat) ?? [];
    return `
      <section class="cat">
        <header>
          <span class="eyebrow">${CATEGORY_LABELS[cat] ?? cat}</span>
          <span class="count">${items.length} win${items.length === 1 ? "" : "s"}</span>
        </header>
        <ul>
          ${items.map((a) => `
            <li>
              <div class="title">${escape(a.title)}</div>
              ${a.description ? `<div class="desc">${escape(a.description)}</div>` : ""}
              <div class="date">${fmtDate(a.createdAt)}</div>
            </li>
          `).join("")}
        </ul>
      </section>
    `;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escape(child.fullName)} · Year-in-review · Plume</title>
<style>
  :root {
    --ink: #1E293B; --ink-soft: #475569; --ink-mute: #64748B;
    --line: #E2E8F0; --bg: #FFFFFF; --surface-2: #F1F5F9;
    --coral: #3B82F6; --coral-deep: #1D4ED8;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: var(--ink); background: var(--bg); }
  .page { max-width: 880px; margin: 0 auto; padding: 56px 48px; }
  .cover { border-bottom: 1px solid var(--line); padding-bottom: 32px; margin-bottom: 32px; }
  .eyebrow { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-mute); font-weight: 500; }
  h1 { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 56px; letter-spacing: -0.025em; line-height: 1; margin: 12px 0 8px; }
  .meta { color: var(--ink-soft); font-size: 14px; margin-top: 6px; }
  .bio { color: var(--ink-soft); font-size: 15px; line-height: 1.6; margin: 16px 0 0; max-width: 560px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 32px 0; }
  .summary > div { padding: 18px; background: var(--surface-2); border-radius: 12px; }
  .summary .label { font-size: 11px; font-family: 'Geist Mono', monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-mute); font-weight: 500; }
  .summary .value { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; margin-top: 4px; letter-spacing: -0.02em; }
  .cat { margin-bottom: 36px; page-break-inside: avoid; }
  .cat header { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--line); margin-bottom: 16px; }
  .cat header .eyebrow { color: var(--coral-deep); }
  .cat header .count { font-size: 12px; color: var(--ink-mute); }
  .cat ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
  .cat li { padding: 16px 0; border-bottom: 1px solid var(--line); }
  .cat li:last-child { border-bottom: 0; }
  .title { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; letter-spacing: -0.015em; }
  .desc { font-size: 14px; color: var(--ink-soft); margin-top: 4px; line-height: 1.55; }
  .date { font-size: 11px; font-family: 'Geist Mono', monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-mute); margin-top: 8px; }
  .empty { padding: 48px; text-align: center; color: var(--ink-mute); border: 1px dashed var(--line); border-radius: 12px; }
  .foot { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 12px; color: var(--ink-mute); display: flex; justify-content: space-between; }
  .print-bar { position: sticky; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; z-index: 10; }
  .print-bar a, .print-bar button { font: inherit; font-size: 13px; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--ink); background: var(--ink); color: #fff; cursor: pointer; text-decoration: none; }
  .print-bar a { background: transparent; color: var(--ink); }
  @media print { .print-bar { display: none; } body { background: #fff; } .page { padding: 24px; } }
</style>
</head>
<body>
  <div class="print-bar">
    <span>Tip: use “Print → Save as PDF” to export this year-in-review.</span>
    <div>
      <a href="javascript:window.close();">Close</a>
      <button onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>
  <div class="page">
    <div class="cover">
      <div class="eyebrow">Plume · Year-in-review</div>
      <h1>${escape(child.fullName)}</h1>
      <div class="meta">${RANGE_LABELS[range] ?? "School year"}${child.profile?.school ? ` · ${escape(child.profile.school)}` : ""}${child.profile?.grade ? ` · ${escape(child.profile.grade)}` : ""}</div>
      ${child.profile?.bio ? `<p class="bio">${escape(child.profile.bio)}</p>` : ""}
    </div>

    <div class="summary">
      <div><div class="label">Achievements</div><div class="value">${achievements.length}</div></div>
      <div><div class="label">Categories</div><div class="value">${orderedCategories.length}</div></div>
      <div><div class="label">Range</div><div class="value" style="font-size:18px;line-height:1.2">${RANGE_LABELS[range] ?? "School year"}</div></div>
    </div>

    ${orderedCategories.length === 0
      ? `<div class="empty">No approved achievements in this range yet.</div>`
      : sectionHtml}

    <div class="foot">
      <span>Generated by Plume · ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
      <span>plume.app</span>
    </div>
  </div>
</body>
</html>`;
}
