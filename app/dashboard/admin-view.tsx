"use client";

/* Admin moderation dashboard — Overview, Moderation, Users, Schools, Reports, Settings. */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Icon, IconName } from "@/app/components/icons";
import {
  Button, Card, Chip, Badge, Toggle, Input, Textarea, Empty, ImgPlaceholder, Field, Modal,
  CATEGORIES, categoryMeta, SectionHeader, Count,
} from "@/app/components/ui";
import { ProfileAvatar } from "@/app/components/profile-avatar";
import {
  AdminOverview, AdminUser, AdminSchool, AdminReviewer, AdminConfigShape,
  User, Achievement, relativeTime, formatDate,
} from "./shared";
import { DashboardShell, NotificationItem, SidebarItem } from "./shell";

type Tab = "overview" | "queue" | "users" | "schools" | "reports" | "settings";

export function AdminDashboard({
  user,
  adminData,
  adminUsers,
  adminSchools,
  adminReviewers,
  adminConfig,
  reload,
  setMessage,
  setError,
  onLogout,
}: {
  user: User;
  adminData: AdminOverview | null;
  adminUsers: AdminUser[] | null;
  adminSchools: AdminSchool[] | null;
  adminReviewers: AdminReviewer[] | null;
  adminConfig: AdminConfigShape | null;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const pendingCount = adminData?.pending.length ?? 0;

  const notifications: NotificationItem[] = useMemo(() => {
    return (adminData?.pending ?? []).slice(0, 8).map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: `${p.child?.fullName ?? "Unknown"} · ${categoryMeta(p.category).label}`,
      meta: relativeTime(p.createdAt),
    }));
  }, [adminData?.pending]);

  const sidebar: SidebarItem[] = [
    { id: "overview",  label: "Overview",    icon: "home" },
    { id: "queue",     label: "Moderation",  icon: "shieldCheck", count: pendingCount },
    { id: "users",     label: "Users",       icon: "users" },
    { id: "schools",   label: "Schools",     icon: "school" },
    { id: "reports",   label: "Reports",     icon: "activity" },
    { id: "settings",  label: "Settings",    icon: "settings" },
  ];
  const labels: Record<Tab, string> = {
    overview: "Overview",
    queue:    "Moderation queue",
    users:    "Users",
    schools:  "Schools",
    reports:  "Reports",
    settings: "Settings",
  };
  const placeholders: Record<Tab, string> = {
    overview: "Search…",
    queue:    "Search pending…",
    users:    "Search name or email…",
    schools:  "Search schools…",
    reports:  "Search reports…",
    settings: "Search…",
  };

  return (
    <DashboardShell
      role="ADMIN"
      user={user}
      sidebar={sidebar}
      active={tab}
      onSelect={(id) => { setTab(id as Tab); setSearch(""); }}
      currentScreenLabel={labels[tab]}
      pendingCount={pendingCount}
      notifications={notifications}
      onOpenNotifications={pendingCount > 0 ? () => setTab("queue") : undefined}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={placeholders[tab]}
      planCard={{
        eyebrow: "Plume Trust",
        title: "Admin team",
        renews: adminReviewers ? `${adminReviewers.length} reviewer${adminReviewers.length === 1 ? "" : "s"} active` : undefined,
      }}
      onLogout={onLogout}
    >
      {tab === "overview" ? <AdminOverviewTab data={adminData} setTab={setTab} /> : null}
      {tab === "queue"    ? <AdminQueue data={adminData} search={search} reload={reload} setMessage={setMessage} setError={setError} /> : null}
      {tab === "users"    ? <AdminUsersTab users={adminUsers} headerSearch={search} reload={reload} setMessage={setMessage} setError={setError} /> : null}
      {tab === "schools"  ? <AdminSchools schools={adminSchools} headerSearch={search} reload={reload} setMessage={setMessage} setError={setError} /> : null}
      {tab === "reports"  ? <AdminReports headerSearch={search} setMessage={setMessage} setError={setError} /> : null}
      {tab === "settings" ? <AdminSettings config={adminConfig} reviewers={adminReviewers} reload={reload} setMessage={setMessage} setError={setError} /> : null}
    </DashboardShell>
  );
}

/* ---------- Overview ---------- */

function AdminOverviewTab({ data, setTab }: { data: AdminOverview | null; setTab: (t: Tab) => void }) {
  if (!data) {
    return <Empty icon="info" title="No data yet" sub="As parents and children sign up, you'll see metrics here." />;
  }
  const m = data.metrics;
  const p50 = data.latency ? humanMs(data.latency.p50Ms) : "—";
  const p99 = data.latency ? humanMs(data.latency.p99Ms) : "—";

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* alert strip */}
      <div className="plm-cols-split" style={{ background: "var(--ink)", color: "var(--surface)", borderRadius: 20, padding: "clamp(16px, 4vw, 28px)", gap: 32, alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "-30% -10% auto auto", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, var(--coral) 0%, transparent 70%)", opacity: 0.3 }} />
        <div style={{ position: "relative" }}>
          <div className="plm-eyebrow" style={{ color: "var(--amber-soft)" }}>Health check</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(24px, 5vw, 40px)", marginTop: 8, color: "var(--surface)" }}>
            {m.pendingAchievements === 0 ? "Plume is calm today." : `${m.pendingAchievements} item${m.pendingAchievements === 1 ? "" : "s"} waiting on you.`}
          </div>
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6, maxWidth: 500 }}>
            {m.pendingAchievements > 0
              ? `Open the moderation queue and clear them. ${m.flaggedAchievements} flagged.`
              : `Zero pending. ${m.flaggedAchievements} flagged. Average review time well within SLA.`}
          </div>
          {m.pendingAchievements > 0 ? (
            <div style={{ marginTop: 24 }}>
              <Button variant="coral" iconRight="arrowRight" onClick={() => setTab("queue")}>Open moderation</Button>
            </div>
          ) : null}
        </div>
        <div className="plm-grid-3" style={{ position: "relative" }}>
          <SmallMetric label="P50 review" value={p50} />
          <SmallMetric label="P99 review" value={p99} />
          <SmallMetric label="Active 28d" value={`${data.retention?.activePct ?? 0}%`} />
        </div>
      </div>

      {/* metrics */}
      <div className="plm-grid-4">
        <BigMetric label="Total users"        value={m.users}        icon="users"   tone="neutral" />
        <BigMetric label="Families"           value={m.families}     icon="shieldCheck" tone="amber" />
        <BigMetric label="Children"           value={m.children}     icon="user"    tone="coral" />
        <BigMetric label="Pending reviews"    value={m.pendingAchievements} icon="checkCircle" tone={m.pendingAchievements > 0 ? "danger" : "sage"} />
      </div>

      {/* weekly series chart + queue preview */}
      <div className="plm-cols-split">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
            <div>
              <div className="plm-eyebrow">Last 12 weeks</div>
              <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6 }}>Achievements logged</div>
            </div>
            <div style={{ display: "flex", padding: 4, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 999, fontSize: 11 }}>
              {["12w", "YTD", "All time"].map((label, i) => (
                <span key={label} style={{
                  padding: "4px 10px", borderRadius: 999, fontWeight: 500,
                  background: i === 0 ? "var(--ink)" : "transparent",
                  color: i === 0 ? "var(--surface)" : "var(--ink-soft)",
                }}>{label}</span>
              ))}
            </div>
          </div>
          <WeeklySeriesChart series={data.weeklySeries ?? []} />
        </Card>

        <Card padding={0}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="plm-display-3" style={{ fontSize: 20 }}>Queue · top of stack</div>
              <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>{data.pending.length} items pending</div>
            </div>
            <Button variant="primary" size="sm" iconRight="arrowRight" onClick={() => setTab("queue")}>Open queue</Button>
          </div>
          <div>
            {data.pending.length === 0 ? (
              <div style={{ padding: 24, color: "var(--ink-mute)", fontSize: 13, textAlign: "center" }}>Queue is empty.</div>
            ) : data.pending.slice(0, 5).map((p, i) => {
              const mc = categoryMeta(p.category);
              return (
                <div key={p.id} style={{ padding: "14px 24px", display: "flex", gap: 12, borderBottom: i < Math.min(4, data.pending.length - 1) ? "1px solid var(--line)" : "none" }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: mc.tone === "neutral" ? "var(--surface-2)" : mc.tone === "teal" ? "var(--teal-soft)" : `var(--${mc.tone}-soft)`,
                      color: mc.tone === "neutral" ? "var(--ink-soft)" : mc.tone === "teal" ? "var(--teal)" : `var(--${mc.tone})`,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <Icon name={mc.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                      {p.child?.fullName ?? "Unknown"} · {relativeTime(p.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* activity by category + retention heatmap */}
      <div className="plm-grid-2">
        <Card>
          <div className="plm-eyebrow">Activity</div>
          <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6 }}>By category · last 30 days</div>
          <CategoryBreakdownBars breakdown={data.categoryBreakdown ?? []} />
        </Card>

        <Card>
          <div className="plm-eyebrow">Retention</div>
          <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6 }}>4-week active families</div>
          <div className="plm-display" style={{ fontSize: "clamp(26px, 6.5vw, 48px)", marginTop: 12 }}>
            {data.retention?.activePct ?? 0}<span style={{ fontSize: 24 }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 14 }}>
            of families have logged a win in the last 28 days.
          </div>
          <RetentionGrid grid={data.retention?.grid ?? []} />
        </Card>
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 14, background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.14)" }}>
      <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono)" }}>{label}</div>
      <div className="plm-display-3" style={{ fontSize: 22, marginTop: 4, color: "var(--surface)" }}>{value}</div>
    </div>
  );
}

function BigMetric({ label, value, icon, tone, sub }: { label: string; value: number; icon: IconName; tone: "neutral" | "coral" | "amber" | "sage" | "danger"; sub?: string }) {
  const tones = {
    neutral: { bg: "var(--surface-2)", color: "var(--ink-soft)" },
    coral:   { bg: "var(--coral-mute)", color: "var(--coral-deep)" },
    amber:   { bg: "var(--amber-mute)", color: "#92400E" },
    sage:    { bg: "var(--sage-soft)",  color: "#065F46" },
    danger:  { bg: "var(--coral-mute)", color: "var(--coral-deep)" },
  };
  const t = tones[tone];
  return (
    <Card padding={20}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="plm-eyebrow">{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={14} strokeWidth={1.9} />
        </div>
      </div>
      <div className="plm-display" style={{ fontSize: "clamp(24px, 5.5vw, 44px)", marginTop: 8, color: "var(--ink)" }}><Count to={value} /></div>
      {sub ? <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{sub}</div> : null}
    </Card>
  );
}

function CategoryBreakdownBars({ breakdown }: { breakdown: { category: string; count: number }[] }) {
  const map = new Map(breakdown.map((b) => [b.category, b.count]));
  const rows = CATEGORIES.map((c) => ({ ...c, n: map.get(c.value) ?? 0 }));
  const total = rows.reduce((s, r) => s + r.n, 0) || 1;
  return (
    <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
      {rows.map((c) => {
        const pct = (c.n / total) * 100;
        return (
          <div key={c.value} style={{ display: "grid", gridTemplateColumns: "140px 1fr 50px", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
              <Icon name={c.icon} size={14} style={{ color: "var(--ink-mute)" }} />{c.label}
            </div>
            <div style={{ height: 14, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.max(2, pct)}%`,
                background: c.tone === "neutral" ? "var(--ink-soft)" : c.tone === "teal" ? "var(--teal)" : `var(--${c.tone})`,
                borderRadius: 999,
              }} />
            </div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, textAlign: "right" }}>{c.n}</div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklySeriesChart({ series }: { series: { weekStart: string; achievements: number; approvals: number; newFamilies: number }[] }) {
  if (series.length === 0) {
    return <div style={{ padding: 32, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>No data yet.</div>;
  }
  const max = Math.max(...series.flatMap((s) => [s.achievements, s.approvals, s.newFamilies]), 1);
  const width = 480;
  const height = 160;
  const stepX = width / (series.length - 1 || 1);
  function path(values: number[]) {
    return values.map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`).join(" ");
  }
  return (
    <div style={{ marginTop: 12 }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height + 24}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <path d={path(series.map((s) => s.achievements))} fill="none" stroke="var(--coral)" strokeWidth={2} />
        <path d={path(series.map((s) => s.approvals))}    fill="none" stroke="var(--amber)" strokeWidth={2} strokeDasharray="5,4" />
        <path d={path(series.map((s) => s.newFamilies))}  fill="none" stroke="var(--sage)" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--ink-mute)", flexWrap: "wrap" }}>
        <LegendDot color="var(--coral)" label={`Achievements (${series.reduce((a, b) => a + b.achievements, 0)})`} />
        <LegendDot color="var(--amber)" label={`Approvals (${series.reduce((a, b) => a + b.approvals, 0)})`} />
        <LegendDot color="var(--sage)" label={`New families (${series.reduce((a, b) => a + b.newFamilies, 0)})`} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function RetentionGrid({ grid }: { grid: number[][] }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: `repeat(${Math.max(grid.length, 1)}, 1fr)`, gap: 4 }}>
      {grid.map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: 4 }}>
          {row.map((v, j) => (
            <span
              key={j}
              title={`${v}%`}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: 4,
                background: `rgba(220, 38, 38, ${0.1 + (v / 100) * 0.55})`,
              }}
            />
          ))}
        </div>
      ))}
      {grid.length === 0 ? (
        <div style={{ padding: 20, fontSize: 12, color: "var(--ink-mute)", textAlign: "center" }}>Heatmap fills in once families start signing up.</div>
      ) : null}
    </div>
  );
}

/* ---------- Queue ---------- */

function AdminQueue({
  data, search, reload, setMessage, setError,
}: {
  data: AdminOverview | null;
  search: string;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const q = search.trim().toLowerCase();
  const allPending = data?.pending ?? [];
  const pending = q
    ? allPending.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.child?.fullName ?? "").toLowerCase().includes(q)
      )
    : allPending;
  const [selectedId, setSelectedId] = useState<string | null>(pending[0]?.id ?? null);
  const [openMessage, setOpenMessage] = useState<Achievement | null>(null);
  const active = pending.find((p) => p.id === selectedId) ?? pending[0];

  if (allPending.length === 0) {
    return <Empty icon="checkCircle" title="Queue empty." sub="Every submission has been reviewed. Nice work." />;
  }

  function nextAfter(id: string) {
    const idx = pending.findIndex((p) => p.id === id);
    if (idx === -1) return pending[0]?.id ?? null;
    return pending[idx + 1]?.id ?? pending[idx - 1]?.id ?? null;
  }

  async function approve(id: string) {
    const res = await fetch(`/api/admin/achievements/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true }),
    });
    if (!res.ok) { setError("Approval failed."); return; }
    setMessage("Approved · published.");
    setSelectedId(nextAfter(id));
    await reload();
  }
  async function reject(id: string) {
    const res = await fetch(`/api/admin/achievements/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Rejection failed."); return; }
    setMessage("Removed from queue.");
    setSelectedId(nextAfter(id));
    await reload();
  }
  function keepPending(id: string) {
    setMessage("Kept pending · skipped to next.");
    setSelectedId(nextAfter(id));
  }
  async function toggleFlag(achievement: Achievement) {
    const res = await fetch(`/api/admin/achievements/${achievement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFlagged: !achievement.isFlagged }),
    });
    if (!res.ok) { setError("Couldn't flag."); return; }
    setMessage(achievement.isFlagged ? "Flag cleared." : "Flagged for senior review.");
    await reload();
  }

  return (
    <div className="plm-cols-sidebar" style={{ gridTemplateColumns: "minmax(0, 380px) 1fr" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="plm-display-3" style={{ fontSize: 20 }}>{pending.length} pending</div>
          <Chip tone="ghost" size="sm" icon="filter">Newest first</Chip>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {pending.map((p) => {
            const mc = categoryMeta(p.category);
            const isActive = p.id === active?.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  textAlign: "left", padding: 14, borderRadius: 14,
                  background: isActive ? "var(--ink)" : "var(--surface)",
                  color: isActive ? "var(--surface)" : "var(--ink)",
                  border: `1px solid ${isActive ? "var(--ink)" : "var(--line)"}`,
                  display: "flex", gap: 12, alignItems: "flex-start",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isActive
                      ? "rgba(255, 255, 255, 0.14)"
                      : (mc.tone === "neutral" ? "var(--surface-2)" : mc.tone === "teal" ? "var(--teal-soft)" : `var(--${mc.tone}-soft)`),
                    color: isActive ? "var(--surface)" : (mc.tone === "neutral" ? "var(--ink-soft)" : mc.tone === "teal" ? "var(--teal)" : `var(--${mc.tone})`),
                    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Icon name={mc.icon} size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                    {p.child?.fullName ?? "Unknown"} · {relativeTime(p.createdAt)}
                  </div>
                </div>
                {p.isFlagged ? <Icon name="flag" size={12} style={{ color: isActive ? "var(--amber-soft)" : "var(--coral-deep)" }} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {active ? (
        <QueueDetail
          item={active}
          onApprove={() => approve(active.id)}
          onReject={() => reject(active.id)}
          onKeepPending={() => keepPending(active.id)}
          onFlag={() => toggleFlag(active)}
          onMessageFamily={() => setOpenMessage(active)}
        />
      ) : null}

      {openMessage ? (
        <MessageFamilyModal
          achievement={openMessage}
          onClose={() => setOpenMessage(null)}
          onSent={() => { setMessage("Message sent to the family."); setOpenMessage(null); }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function QueueDetail({
  item, onApprove, onReject, onKeepPending, onFlag, onMessageFamily,
}: {
  item: Achievement;
  onApprove: () => void;
  onReject: () => void;
  onKeepPending: () => void;
  onFlag: () => void;
  onMessageFamily: () => void;
}) {
  const mc = categoryMeta(item.category);
  const proofType = item.proofFileUrl ? "File upload" : item.proofUrl ? "External link" : "None";

  return (
    <Card padding={0}>
      <div style={{ padding: "clamp(14px, 3vw, 20px) clamp(16px, 3.5vw, 28px)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Chip size="sm" icon={mc.icon} tone={mc.tone}>{mc.label}</Chip>
          <Badge tone="warn" dot>Pending · {relativeTime(item.createdAt)}</Badge>
          {item.isFlagged ? <Badge tone="danger" dot>Flagged</Badge> : null}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant={item.isFlagged ? "coral" : "outline"} size="sm" icon="flag" onClick={onFlag}>
            {item.isFlagged ? "Unflag" : "Flag"}
          </Button>
          <Button variant="outline" size="sm" icon="moreHorizontal">More</Button>
        </div>
      </div>
      <div style={{ padding: 28 }}>
        <div className="plm-display-2" style={{ fontSize: 32 }}>{item.title}</div>
        {item.description ? <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.6, maxWidth: 640 }}>{item.description}</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginTop: 28 }}>
          {item.proofFileUrl && !item.proofFileUrl.endsWith(".pdf") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.proofFileUrl} alt={item.title} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 14 }} />
          ) : (
            <ImgPlaceholder
              label={item.proofFileUrl ? "PDF certificate" : item.proofUrl ? "external link" : "no proof attached"}
              aspect="16 / 10"
              tone={mc.tone === "neutral" || mc.tone === "teal" ? "cream" : mc.tone}
            />
          )}
          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <Field label="Submitted by"  value={item.child?.fullName ?? "Unknown"} icon="user" />
            <Field label="Submitted"     value={formatDate(item.createdAt)}          icon="clock" />
            <Field label="Account status" value="Active · in good standing" icon="shieldCheck" />
            <Field label="Proof type"    value={proofType} icon="file" />
            {item.proofUrl ? (
              <a href={item.proofUrl} target="_blank" rel="noreferrer noopener" style={{ fontSize: 13, color: "var(--coral-deep)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "underline" }}>
                <Icon name="link" size={14} /> Open the link
              </a>
            ) : null}
            {item.proofFileUrl ? (
              <a href={item.proofFileUrl} target="_blank" rel="noreferrer noopener" style={{ fontSize: 13, color: "var(--coral-deep)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "underline" }}>
                <Icon name="file" size={14} /> Open proof file
              </a>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 28, padding: 18, background: "var(--surface-2)", borderRadius: 14 }}>
          <div className="plm-eyebrow" style={{ marginBottom: 8 }}>Moderation checklist</div>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              "Content matches the description",
              "No identifying info of other children",
              "Proof file is age-appropriate",
              "Title is honest (no exaggeration)",
            ].map((c) => (
              <label key={c} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                <input type="checkbox" defaultChecked /> {c}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="coral" icon="check" onClick={onApprove}>Approve &amp; publish</Button>
          <Button variant="outline" icon="clock" onClick={onKeepPending}>Keep pending</Button>
          <Button variant="danger" icon="x" onClick={onReject}>Reject</Button>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" icon="mail" onClick={onMessageFamily}>Message family</Button>
        </div>
      </div>
    </Card>
  );
}

function MessageFamilyModal({
  achievement, onClose, onSent, onError,
}: {
  achievement: Achievement;
  onClose: () => void;
  onSent: () => void;
  onError: (m: string) => void;
}) {
  const [subject, setSubject] = useState(`About “${achievement.title}”`);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementId: achievement.id, subject, body }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "Couldn't send.");
      return;
    }
    onSent();
  }

  return (
    <Modal open onClose={onClose} maxWidth={580}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="plm-eyebrow">Message family</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 3.5vw, 26px)", marginTop: 6 }}>About this win</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--ink-mute)" }} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <form onSubmit={send} style={{ display: "grid", gap: 12 }}>
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required minLength={2} maxLength={140} />
        <Textarea label="Message" value={body} onChange={(e) => setBody(e.currentTarget.value)} rows={5} maxLength={2000} showCounter required minLength={2} placeholder="Hi — just letting you know…" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon="mail" disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Users ---------- */

function AdminUsersTab({
  users, headerSearch, reload, setMessage, setError,
}: {
  users: AdminUser[] | null;
  headerSearch: string;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const [role, setRole] = useState<"ALL" | "PARENT" | "CHILD" | "ADMIN">("ALL");
  const [query, setQuery] = useState("");
  const [openInvite, setOpenInvite] = useState(false);
  const effectiveQuery = (query || headerSearch).toLowerCase().trim();

  const filtered = useMemo(() => {
    return (users ?? []).filter((u) =>
      (role === "ALL" || u.role === role) &&
      (!effectiveQuery || u.fullName.toLowerCase().includes(effectiveQuery) || u.email.toLowerCase().includes(effectiveQuery))
    );
  }, [users, role, effectiveQuery]);

  async function toggleSuspend(u: AdminUser) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSuspended: !u.isSuspended }),
    });
    if (!res.ok) { setError("Couldn't update user."); return; }
    setMessage(u.isSuspended ? "Reinstated." : "Suspended.");
    await reload();
  }

  async function deleteUser(u: AdminUser) {
    if (!window.confirm(`Permanently delete ${u.fullName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) { setError("Couldn't delete user."); return; }
    setMessage("User deleted.");
    await reload();
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Users"
        title={`${users?.length ?? 0} accounts`}
        sub="Manage parents, children, and admin team. Search by name or email."
        right={
          <Button variant="primary" icon="plus" onClick={() => setOpenInvite(true)}>Invite admin</Button>
        }
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", padding: 4, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999 }}>
          {([
            { id: "ALL",    label: "All" },
            { id: "PARENT", label: "Parents" },
            { id: "CHILD",  label: "Children" },
            { id: "ADMIN",  label: "Admins" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setRole(t.id)}
              style={{
                padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                background: role === t.id ? "var(--ink)" : "transparent",
                color: role === t.id ? "var(--surface)" : "var(--ink-soft)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Input icon="search" placeholder="Search name or email…" value={query} onChange={(e) => setQuery(e.currentTarget.value)} fullWidth />
        </div>
      </div>

      <Card padding={0}>
        <div className="plm-row-table plm-row-table-head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "14px 24px", borderBottom: "1px solid var(--line)" }}>
          {["User", "Role", "Joined", "Status", ""].map((h) => (
            <div key={h} className="plm-eyebrow">{h}</div>
          ))}
        </div>
        {filtered.map((u) => (
          <div key={u.id} className="plm-row-table" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "16px 24px", borderBottom: "1px solid var(--line)", alignItems: "center", fontSize: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <ProfileAvatar name={u.fullName} size={36} />
              <div>
                <div style={{ fontWeight: 500 }}>{u.fullName}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{u.email}</div>
              </div>
            </div>
            <div>
              <Chip size="sm" tone={u.role === "ADMIN" ? "coral" : u.role === "PARENT" ? "amber" : "neutral"}>
                {u.role.toLowerCase()}
              </Chip>
            </div>
            <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{formatDate(u.createdAt)}</div>
            <div>{u.isSuspended ? <Badge tone="danger" dot>Suspended</Badge> : <Badge tone="success" dot>Active</Badge>}</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <button
                onClick={() => toggleSuspend(u)}
                style={{ color: "var(--ink-mute)", padding: 6 }}
                title={u.isSuspended ? "Reinstate" : "Suspend"}
              >
                <Icon name={u.isSuspended ? "unlock" : "lock"} size={15} />
              </button>
              <button
                onClick={() => deleteUser(u)}
                style={{ color: "var(--ink-mute)", padding: 6 }}
                title="Delete user"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div style={{ padding: 24, color: "var(--ink-mute)", fontSize: 13, textAlign: "center" }}>No users match your filter.</div>
        ) : null}
      </Card>

      {openInvite ? (
        <InviteAdminModal
          onClose={() => setOpenInvite(false)}
          onInvited={async () => { await reload(); setMessage("Admin invited."); setOpenInvite(false); }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function InviteAdminModal({ onClose, onInvited, onError }: { onClose: () => void; onInvited: () => void; onError: (m: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Reviewer");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ tempPassword: string; email: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, reviewerTitle: title }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "Couldn't invite admin.");
      return;
    }
    const data = (await res.json()) as { tempPassword: string };
    setIssued({ tempPassword: data.tempPassword, email });
  }

  return (
    <Modal open onClose={onClose} maxWidth={520}>
      {issued ? (
        <>
          <div className="plm-eyebrow">Admin invited</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Share this password securely</div>
          <p style={{ color: "var(--ink-soft)", marginTop: 12, fontSize: 14 }}>
            Send these credentials to <strong>{issued.email}</strong>. They&apos;ll be asked to change the password after first sign-in.
          </p>
          <div style={{ background: "var(--surface-2)", padding: 14, borderRadius: 12, marginTop: 16, fontFamily: "var(--font-geist-mono)", fontSize: 13, wordBreak: "break-all" }}>
            <div>Email: {issued.email}</div>
            <div>Password: {issued.tempPassword}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="primary" icon="check" onClick={onInvited}>Done</Button>
          </div>
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="plm-eyebrow">Invite admin</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Add a teammate</div>
          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} required minLength={2} maxLength={80} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <Input label="Title" placeholder="Reviewer / Senior reviewer / Head of Trust" value={title} onChange={(e) => setTitle(e.currentTarget.value)} maxLength={80} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" icon="plus" disabled={busy}>{busy ? "Inviting…" : "Invite"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ---------- Schools ---------- */

function AdminSchools({
  schools, headerSearch, reload, setMessage, setError,
}: {
  schools: AdminSchool[] | null;
  headerSearch: string;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const q = headerSearch.trim().toLowerCase();
  const filtered = (schools ?? []).filter((s) =>
    !q ||
    s.name.toLowerCase().includes(q) ||
    (s.city ?? "").toLowerCase().includes(q)
  );
  const [openAdd, setOpenAdd] = useState(false);
  const [openRoster, setOpenRoster] = useState<AdminSchool | null>(null);

  async function setStatus(id: string, status: AdminSchool["status"]) {
    const res = await fetch(`/api/admin/schools/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { setError("Couldn't update."); return; }
    setMessage("School updated.");
    await reload();
  }

  async function deleteSchool(s: AdminSchool) {
    if (!window.confirm(`Remove ${s.name}? Children linked to this school will be unlinked but not deleted.`)) return;
    const res = await fetch(`/api/admin/schools/${s.id}`, { method: "DELETE" });
    if (!res.ok) { setError("Couldn't delete."); return; }
    setMessage("School removed.");
    await reload();
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Schools"
        title={`${schools?.length ?? 0} institution${(schools?.length ?? 0) === 1 ? "" : "s"}`}
        sub="School integrations enable bulk roster sync and teacher co-signs."
        right={<Button variant="primary" icon="plus" onClick={() => setOpenAdd(true)}>Add school</Button>}
      />

      {filtered.length === 0 ? (
        <Empty
          icon="school"
          title={schools?.length === 0 ? "No schools yet" : "No matches"}
          sub={schools?.length === 0 ? "Add your first institution to unlock B2B onboarding." : `No schools match “${headerSearch}”.`}
          action={schools?.length === 0 ? <Button variant="primary" icon="plus" onClick={() => setOpenAdd(true)}>Add school</Button> : undefined}
        />
      ) : (
        <div className="plm-grid-2">
          {filtered.map((s) => (
            <Card key={s.id} padding={0}>
              <div style={{ padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="plm-display-3" style={{ fontSize: 22 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
                    {s.familiesCount} famil{s.familiesCount === 1 ? "y" : "ies"} · {s.childrenCount} child{s.childrenCount === 1 ? "" : "ren"}
                    {s.city ? ` · ${s.city}` : ""}
                  </div>
                </div>
                <Badge tone={s.status === "ACTIVE" ? "success" : s.status === "PILOT" ? "warn" : "neutral"} dot>{s.status.toLowerCase()}</Badge>
              </div>
              <div style={{ padding: "0 22px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="outline" size="sm" icon="users" onClick={() => setOpenRoster(s)}>Roster</Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon="settings"
                  onClick={() => {
                    const nextStatus: AdminSchool["status"] = s.status === "ACTIVE" ? "PILOT" : s.status === "PILOT" ? "INACTIVE" : "ACTIVE";
                    void setStatus(s.id, nextStatus);
                  }}
                >
                  {s.status === "ACTIVE" ? "Move to pilot" : s.status === "PILOT" ? "Mark inactive" : "Reactivate"}
                </Button>
                <div style={{ flex: 1 }} />
                <button onClick={() => deleteSchool(s)} title="Remove school" style={{ color: "var(--ink-mute)" }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {openAdd ? (
        <AddSchoolModal
          onClose={() => setOpenAdd(false)}
          onAdded={async () => { await reload(); setMessage("School added."); setOpenAdd(false); }}
          onError={setError}
        />
      ) : null}

      {openRoster ? (
        <RosterModal school={openRoster} onClose={() => setOpenRoster(null)} onError={setError} />
      ) : null}
    </div>
  );
}

function AddSchoolModal({ onClose, onAdded, onError }: { onClose: () => void; onAdded: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AdminSchool["status"]>("PILOT");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, notes, status }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "Couldn't add school.");
      return;
    }
    onAdded();
  }

  return (
    <Modal open onClose={onClose} maxWidth={520}>
      <form onSubmit={submit}>
        <div className="plm-eyebrow">New school</div>
        <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Add an institution</div>
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <Input label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required minLength={2} maxLength={120} placeholder="Dubai Modern Academy" />
          <Input label="City (optional)" value={city} onChange={(e) => setCity(e.currentTarget.value)} maxLength={80} placeholder="Dubai" />
          <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} rows={3} maxLength={400} placeholder="Champion, contract date, anything." />
          <div>
            <div className="plm-label">Status</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["PILOT", "ACTIVE", "INACTIVE"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                    background: status === s ? "var(--ink)" : "var(--surface)",
                    color: status === s ? "var(--surface)" : "var(--ink-soft)",
                    border: `1px solid ${status === s ? "var(--ink)" : "var(--line)"}`,
                  }}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon="plus" disabled={busy}>{busy ? "Adding…" : "Add school"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RosterModal({ school, onClose, onError }: { school: AdminSchool; onClose: () => void; onError: (m: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<Array<{ id: string; fullName: string; email: string; grade: string | null; age: number; achievementCount: number; isSuspended: boolean }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/schools/${school.id}/roster`, { cache: "no-store" });
      if (!res.ok) {
        if (!cancelled) {
          onError("Couldn't load roster.");
          setLoading(false);
        }
        return;
      }
      const data = (await res.json()) as { roster: typeof roster };
      if (!cancelled) {
        setRoster(data.roster);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school.id]);

  return (
    <Modal open onClose={onClose} maxWidth={680}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div className="plm-eyebrow">Roster</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>{school.name}</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
            {school.familiesCount} famil{school.familiesCount === 1 ? "y" : "ies"} · {school.childrenCount} child{school.childrenCount === 1 ? "" : "ren"}
          </div>
        </div>
        <button onClick={onClose} style={{ color: "var(--ink-mute)" }} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 18, maxHeight: "60vh", overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>Loading…</div>
        ) : roster.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>No children linked to this school yet.</div>
        ) : (
          roster.map((c) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: 14, background: "var(--surface-2)", borderRadius: 12 }}>
              <ProfileAvatar name={c.fullName} size={36} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.fullName}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{c.email} · age {c.age}{c.grade ? ` · ${c.grade}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Chip size="sm" tone="ghost">{c.achievementCount} wins</Chip>
                {c.isSuspended ? <Badge tone="danger" dot>Suspended</Badge> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

/* ---------- Reports ---------- */

function AdminReports({
  headerSearch, setMessage, setError,
}: {
  headerSearch: string;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const reports: Array<{ id: string; icon: IconName; title: string; description: string; tone: "coral" | "amber" | "sage" | "plum" | "teal"; type: string }> = [
    { id: "trust-safety",      icon: "shield",   title: "Trust & safety weekly", description: "All moderation decisions, reviewer times, and rejection reasons.", tone: "coral", type: "trust-safety" },
    { id: "growth",            icon: "activity", title: "Growth dashboard CSV",  description: "New families, activations, retention cohorts, by week.",        tone: "amber", type: "growth" },
    { id: "revenue",           icon: "trophy",   title: "Revenue snapshot",      description: "MRR, ARR, churn, plan distribution. Monthly.",                  tone: "sage",  type: "revenue" },
    { id: "moderation-log",    icon: "list",     title: "Content moderation log",description: "Per-item decision log with reviewer ID and timestamps.",        tone: "plum",  type: "moderation-log" },
    { id: "school-engagement", icon: "school",   title: "School engagement",     description: "Adoption funnel per institution: invited → onboarded.",         tone: "teal",  type: "school-engagement" },
    { id: "data-residency",    icon: "lock",     title: "Data residency audit",  description: "Storage location, encryption keys, and access events.",         tone: "amber", type: "data-residency" },
  ];

  const q = headerSearch.trim().toLowerCase();
  const filtered = q ? reports.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) : reports;

  function exportReport(type: string) {
    const url = `/api/admin/reports/${type}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMessage("Export started — download will appear shortly.");
  }

  function schedule() {
    setError("Scheduled exports are coming with the next platform release.");
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Reports"
        title="Export data"
        sub="Daily, weekly, and ad-hoc exports for product, finance, and trust & safety."
      />
      <div className="plm-grid-3">
        {filtered.map((r) => (
          <Card key={r.id} padding={22}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: r.tone === "teal" ? "var(--teal-soft)" : `var(--${r.tone}-soft)`,
                color: r.tone === "teal" ? "var(--teal)" : `var(--${r.tone})`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name={r.icon} size={18} />
            </div>
            <div className="plm-display-3" style={{ fontSize: 20, marginTop: 14 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5, minHeight: 56 }}>
              {r.description}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Button variant="cream" size="sm" icon="download" onClick={() => exportReport(r.type)} full>Export CSV</Button>
              <Button variant="outline" size="sm" icon="calendar" onClick={schedule}>Schedule</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function AdminSettings({
  config, reviewers, reload, setMessage, setError,
}: {
  config: AdminConfigShape | null;
  reviewers: AdminReviewer[] | null;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const [openInvite, setOpenInvite] = useState(false);

  async function patch(field: keyof AdminConfigShape, value: boolean) {
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) { setError("Couldn't update settings."); return; }
    setMessage("Saved.");
    await reload();
  }

  return (
    <div className="plm-grid-2">
      <Card>
        <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 16 }}>Moderation policy</div>
        <div style={{ display: "grid", gap: 16 }}>
          <Toggle
            checked={config?.autoApproveParent ?? true}
            onChange={(v) => patch("autoApproveParent", v)}
            label="Auto-approve parent uploads"
            sublabel="Uploads from accounts marked PARENT skip the queue"
          />
          <Toggle
            checked={config?.holdChildUploads ?? true}
            onChange={(v) => patch("holdChildUploads", v)}
            label="Hold child uploads for review"
            sublabel="All CHILD-account uploads enter the queue"
          />
          <Toggle
            checked={config?.requireProof ?? false}
            onChange={(v) => patch("requireProof", v)}
            label="Require proof file"
            sublabel="Reject uploads without a certificate, photo, or link"
          />
          <Toggle
            checked={config?.csamHashCheck ?? true}
            onChange={(v) => patch("csamHashCheck", v)}
            label="Hash uploads against known CSAM"
            sublabel="Off-device hashing via PhotoDNA-compatible signatures"
          />
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="plm-display-3" style={{ fontSize: 20 }}>Reviewer team</div>
          <Button variant="cream" size="sm" icon="plus" onClick={() => setOpenInvite(true)}>Invite reviewer</Button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {(reviewers ?? []).map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 4px" }}>
              <ProfileAvatar name={r.fullName} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.fullName}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{r.reviewerTitle}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em" }}>
                {r.weeklyReviews} reviews · 7d
              </div>
            </div>
          ))}
          {(reviewers ?? []).length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: "var(--ink-mute)", textAlign: "center" }}>No admin teammates yet.</div>
          ) : null}
        </div>
      </Card>

      <Card style={{ gridColumn: "span 2" }}>
        <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 16 }}>Trust & safety</div>
        <ul style={{ fontSize: 13, color: "var(--ink-soft)", padding: 0, listStyle: "none", margin: 0, display: "grid", gap: 8 }}>
          <li style={{ display: "flex", gap: 10 }}>
            <Icon name="shield" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} />
            All uploads are SHA-256 hashed on receipt. Hashes can be matched against PhotoDNA / NCMEC Take-It-Down feeds when integrated.
          </li>
          <li style={{ display: "flex", gap: 10 }}>
            <Icon name="shield" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} />
            Suspended users are immediately signed out across all sessions. Session tokens are invalidated DB-side, not just cleared client-side.
          </li>
          <li style={{ display: "flex", gap: 10 }}>
            <Icon name="shield" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} />
            Family deletion cascades child accounts, achievements, and uploads in a single transaction.
          </li>
          <li style={{ display: "flex", gap: 10 }}>
            <Icon name="shield" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} />
            Every moderation action is recorded with reviewer ID, latency, and snapshot — auditable via the Content moderation log export.
          </li>
        </ul>
      </Card>

      {openInvite ? (
        <InviteReviewerModal
          onClose={() => setOpenInvite(false)}
          onInvited={async () => { await reload(); setMessage("Reviewer invited."); setOpenInvite(false); }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function InviteReviewerModal({ onClose, onInvited, onError }: { onClose: () => void; onInvited: () => void; onError: (m: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Reviewer");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ tempPassword: string; email: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/reviewers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, reviewerTitle: title }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "Couldn't invite reviewer.");
      return;
    }
    const data = (await res.json()) as { tempPassword: string };
    setIssued({ tempPassword: data.tempPassword, email });
  }

  return (
    <Modal open onClose={onClose} maxWidth={520}>
      {issued ? (
        <>
          <div className="plm-eyebrow">Reviewer invited</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Share these credentials</div>
          <div style={{ background: "var(--surface-2)", padding: 14, borderRadius: 12, marginTop: 16, fontFamily: "var(--font-geist-mono)", fontSize: 13, wordBreak: "break-all" }}>
            <div>Email: {issued.email}</div>
            <div>Password: {issued.tempPassword}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="primary" icon="check" onClick={onInvited}>Done</Button>
          </div>
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="plm-eyebrow">Invite reviewer</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Add to the trust team</div>
          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} required minLength={2} maxLength={80} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <Input label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} maxLength={80} placeholder="Reviewer / Senior reviewer / Head of Trust" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" icon="plus" disabled={busy}>{busy ? "Inviting…" : "Invite"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ---------- helpers ---------- */

function humanMs(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
