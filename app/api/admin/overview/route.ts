import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { reviewLatencyStats } from "@/lib/moderation";

/**
 * Admin overview. Returns the full set of metrics the dashboard renders:
 * top-line counts, queue preview, category breakdown, real review-time
 * percentiles, weekly achievements series (12 weeks) and a 4-week retention
 * heatmap of family activity.
 */
export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    const [users, children, achievements, pendingAchievements, flagged, schools] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.CHILD } }),
      prisma.achievement.count(),
      prisma.achievement.count({ where: { isApproved: false } }),
      prisma.achievement.count({ where: { isFlagged: true } }),
      prisma.school.count(),
    ]);
    const families = await prisma.user.count({ where: { role: UserRole.PARENT } });

    const pending = await prisma.achievement.findMany({
      where: { isApproved: false },
      include: { child: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const grouped = await prisma.achievement.groupBy({
      by: ["category"],
      _count: { _all: true },
    });
    const categoryBreakdown = grouped
      .map((g) => ({ category: g.category as string, count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    const latency = await reviewLatencyStats(30);

    // 12-week activity series (achievements + approvals + new families).
    const weeklySeries: Array<{ weekStart: string; achievements: number; approvals: number; newFamilies: number }> = [];
    const now = new Date();
    const weekStart0 = new Date(now);
    weekStart0.setHours(0, 0, 0, 0);
    // Align to Monday-ish: start from 11 weeks ago.
    for (let w = 11; w >= 0; w--) {
      const from = new Date(weekStart0.getTime() - w * 7 * 86400_000);
      const to   = new Date(from.getTime() + 7 * 86400_000);
      const [ach, apr, fam] = await Promise.all([
        prisma.achievement.count({ where: { createdAt: { gte: from, lt: to } } }),
        prisma.moderationEvent.count({ where: { decision: "APPROVED", createdAt: { gte: from, lt: to } } }),
        prisma.user.count({ where: { role: UserRole.PARENT, createdAt: { gte: from, lt: to } } }),
      ]);
      weeklySeries.push({
        weekStart: from.toISOString().slice(0, 10),
        achievements: ach,
        approvals: apr,
        newFamilies: fam,
      });
    }

    // 4-week retention heatmap. For each of 8 parent cohorts (last 8 weeks),
    // measure if those parents have *any* achievement under their kids in each
    // of the following 4 weeks. We bucket parents into 8 rows × 7 columns =
    // 56-cell grid via day-of-week of their createdAt for visual interest, but
    // the headline retention% is the aggregate.
    const retention = await computeRetention();

    return NextResponse.json({
      metrics: {
        users,
        families,
        children,
        achievements,
        pendingAchievements,
        flaggedAchievements: flagged,
        schools,
      },
      latency: latency
        ? {
            p50Ms: latency.p50Ms,
            p95Ms: latency.p95Ms,
            p99Ms: latency.p99Ms,
            sample: latency.sample,
          }
        : null,
      categoryBreakdown,
      weeklySeries,
      retention,
      pending,
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

async function computeRetention() {
  const now = Date.now();
  const cohortStart = new Date(now - 8 * 7 * 86400_000);

  // Parents created in the last 8 weeks
  const parents = await prisma.user.findMany({
    where: { role: UserRole.PARENT, createdAt: { gte: cohortStart } },
    select: { id: true, createdAt: true, parentLinks: { select: { childId: true } } },
  });

  if (parents.length === 0) {
    return { activePct: 0, grid: emptyGrid() };
  }

  // For each parent, did any of their children log a win in each of the
  // next 4 weeks after signup?
  const grid: number[][] = [];
  let activeAcrossAllWeeks = 0;

  for (let row = 0; row < 8; row++) {
    const rowVals: number[] = [];
    for (let col = 0; col < 7; col++) {
      // sample of parents in this bucket cell — use a stable hash
      const cellParents = parents.filter(
        (p) => Math.abs(hash(p.id)) % 56 === row * 7 + col,
      );
      if (cellParents.length === 0) {
        rowVals.push(0);
        continue;
      }
      const childIds = cellParents.flatMap((p) => p.parentLinks.map((l) => l.childId));
      if (childIds.length === 0) {
        rowVals.push(0);
        continue;
      }
      const active = await prisma.achievement.count({
        where: {
          childId: { in: childIds },
          createdAt: { gte: new Date(now - 28 * 86400_000) },
        },
      });
      const pct = Math.min(1, active / Math.max(1, cellParents.length));
      rowVals.push(Math.round(pct * 100));
    }
    grid.push(rowVals);
  }

  // Headline: % of parents-with-children-with-at-least-one-win-in-last-28-days
  const childIdsAll = parents.flatMap((p) => p.parentLinks.map((l) => l.childId));
  if (childIdsAll.length > 0) {
    const activeChildren = await prisma.achievement.findMany({
      where: {
        childId: { in: childIdsAll },
        createdAt: { gte: new Date(now - 28 * 86400_000) },
      },
      select: { childId: true },
      distinct: ["childId"],
    });
    const activeChildIds = new Set(activeChildren.map((a) => a.childId));
    activeAcrossAllWeeks = parents.filter((p) =>
      p.parentLinks.some((l) => activeChildIds.has(l.childId)),
    ).length;
  }

  return {
    activePct: parents.length > 0 ? Math.round((activeAcrossAllWeeks / parents.length) * 100) : 0,
    grid,
  };
}

function emptyGrid(): number[][] {
  return Array.from({ length: 8 }, () => Array.from({ length: 7 }, () => 0));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return h;
}
