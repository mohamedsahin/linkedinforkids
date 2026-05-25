"use client";

/* Parent view of the dashboard — overview, children, review queue, settings */

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/app/components/icons";
import {
  Button, Card, Chip, Badge, Toggle, ImgPlaceholder, Empty, Field, Count, Input,
  CATEGORIES, categoryMeta, SectionHeader,
} from "@/app/components/ui";
import { ProfileAvatar } from "@/app/components/profile-avatar";
import { FileUploadButton } from "@/app/components/file-upload-button";
import { Confetti } from "@/app/components/confetti";
import { useLocalBool } from "@/lib/preferences";
import {
  ParentChildLink, MeResponse, User, Achievement, formatDate, lastActiveLabel, relativeTime,
} from "./shared";
import { DashboardShell, NotificationItem, SidebarItem } from "./shell";
import { AddChildModal, EditProfileModal, AchievementModal, EditAchievementModal } from "./modals";

type Tab = "overview" | "children" | "review" | "reports" | "settings";

export function ParentDashboard({
  user,
  meData,
  reload,
  setMessage,
  setError,
  onLogout,
}: {
  user: User;
  meData: MeResponse | null;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
  onLogout: () => void;
}) {
  const links = useMemo(() => meData?.parentData ?? [], [meData?.parentData]);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(links[0]?.child.id ?? null);
  const [openAddChild, setOpenAddChild] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openEdit, setOpenEdit] = useState<string | null>(null);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const [search, setSearch] = useState("");

  const pendingCount = useMemo(
    () => links.reduce((n, l) => n + l.child.achievements.filter((a) => !a.isApproved).length, 0),
    [links]
  );

  const notifications: NotificationItem[] = useMemo(() => {
    return links
      .flatMap((l) => l.child.achievements
        .filter((a) => !a.isApproved)
        .map((a) => ({
          id: a.id,
          title: `${l.child.fullName.split(" ")[0]}: ${a.title}`,
          subtitle: "Waiting for your approval",
          meta: relativeTime(a.createdAt),
        }))
      )
      .slice(0, 8);
  }, [links]);

  const sidebar: SidebarItem[] = [
    { id: "overview", label: "Overview",        icon: "home" },
    { id: "children", label: "My children",     icon: "users" },
    { id: "review",   label: "Review queue",    icon: "checkCircle", count: pendingCount },
    { id: "reports",  label: "Reports",         icon: "activity" },
    { id: "settings", label: "Family settings", icon: "settings" },
  ];

  const labels: Record<Tab, string> = {
    overview: "Overview",
    children: "My children",
    review: "Review queue",
    reports: "Reports & exports",
    settings: "Family settings",
  };

  const searchPlaceholder: Record<Tab, string> = {
    overview: "Search…",
    children: "Search children…",
    review: "Search pending wins…",
    reports: "Search children…",
    settings: "Search…",
  };

  return (
    <DashboardShell
      role="PARENT"
      user={user}
      sidebar={sidebar}
      active={tab}
      onSelect={(id) => { setTab(id as Tab); setSearch(""); }}
      currentScreenLabel={labels[tab]}
      pendingCount={pendingCount}
      notifications={notifications}
      onOpenNotifications={pendingCount > 0 ? () => setTab("review") : undefined}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder[tab]}
      planCard={{
        eyebrow: "Family plan",
        title: "Family+",
        renews: "Renews 12 May 2026",
        cta: { label: "Manage plan", onClick: () => setMessage("Plan management is coming soon.") },
      }}
      onLogout={onLogout}
      headerRight={
        <Button variant="primary" size="sm" icon="plus" onClick={() => setOpenUpload(true)} disabled={links.length === 0}>
          Log a win
        </Button>
      }
    >
      {tab === "overview" ? (
        <ParentOverview
          user={user}
          links={links}
          pendingCount={pendingCount}
          onUpload={() => setOpenUpload(true)}
          onAddChild={() => setOpenAddChild(true)}
          onSelectKid={(id) => { setSelectedChildId(id); setTab("children"); }}
          onOpenReview={() => setTab("review")}
        />
      ) : null}

      {tab === "children" ? (
        <ParentChildren
          links={links}
          selectedChildId={selectedChildId}
          onSelect={setSelectedChildId}
          onAddChild={() => setOpenAddChild(true)}
          onEdit={(id) => setOpenEdit(id)}
          search={search}
          reload={reload}
          setMessage={setMessage}
          setError={setError}
        />
      ) : null}

      {tab === "review" ? (
        <ParentReview
          links={links}
          search={search}
          reload={reload}
          setMessage={setMessage}
          setError={setError}
          onApproved={() => setCelebrate((n) => n + 1)}
          onEditFirst={(a) => setEditAchievement(a)}
        />
      ) : null}

      {tab === "reports" ? (
        <ParentReports links={links} search={search} setError={setError} />
      ) : null}

      {tab === "settings" ? (
        <ParentSettings
          user={user}
          links={links}
          reload={reload}
          setMessage={setMessage}
          setError={setError}
          onLogout={onLogout}
        />
      ) : null}

      <AddChildModal
        open={openAddChild}
        onClose={() => setOpenAddChild(false)}
        onCreated={async () => { await reload(); setMessage("Child profile created."); }}
        onError={(m) => setError(m)}
      />

      <AchievementModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        // eslint-disable-next-line react/no-children-prop
        children={links.map((l) => ({ id: l.child.id, name: l.child.fullName }))}
        defaultChildId={selectedChildId ?? links[0]?.child.id}
        mode="parent"
        onCreated={async () => {
          await reload();
          setMessage("Achievement saved · published.");
          setCelebrate((n) => n + 1);
        }}
        onError={(m) => setError(m)}
      />

      <Confetti trigger={celebrate} />

      {openEdit ? (() => {
        const link = links.find((l) => l.child.id === openEdit);
        if (!link?.child.childProfile) return null;
        return (
          <EditProfileModal
            open={true}
            onClose={() => setOpenEdit(null)}
            childId={link.child.id}
            profile={link.child.childProfile}
            onSaved={async () => { await reload(); setMessage("Profile updated."); }}
            onError={(m) => setError(m)}
          />
        );
      })() : null}

      {editAchievement ? (
        <EditAchievementModal
          open={true}
          onClose={() => setEditAchievement(null)}
          achievement={editAchievement}
          onSaved={async ({ approved }) => {
            await reload();
            setMessage(approved ? "Edited · approved · published." : "Edits saved.");
            if (approved) setCelebrate((n) => n + 1);
          }}
          onError={(m) => setError(m)}
        />
      ) : null}
    </DashboardShell>
  );
}

/* ---------- Overview ---------- */

function ParentOverview({
  user,
  links,
  pendingCount,
  onUpload,
  onAddChild,
  onSelectKid,
  onOpenReview,
}: {
  user: User;
  links: ParentChildLink[];
  pendingCount: number;
  onUpload: () => void;
  onAddChild: () => void;
  onSelectKid: (id: string) => void;
  onOpenReview: () => void;
}) {
  const totalAch = links.reduce((n, l) => n + l.child.achievements.length, 0);
  const publicProfiles = links.filter((l) => l.child.childProfile?.isPublic).length;
  const recent = links
    .flatMap((l) => l.child.achievements.map((a) => ({ ...a, kid: l.child })))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  if (links.length === 0) {
    return (
      <div style={{ display: "grid", gap: 32 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22, padding: 56, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "auto -10% -100% auto", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, var(--coral-mute) 0%, transparent 65%)" }} />
          <div style={{ position: "relative", maxWidth: 480, marginInline: "auto" }}>
            <div className="plm-eyebrow">Welcome to Plume</div>
            <h1 className="plm-display-2" style={{ fontSize: "clamp(26px, 6.5vw, 48px)", marginTop: 16 }}>
              Hi {user.fullName.split(" ")[0]}.<br />
              <span style={{ fontStyle: "italic", color: "var(--coral)" }}>Add your first child</span> to begin.
            </h1>
            <p style={{ marginTop: 16, color: "var(--ink-soft)" }}>
              Children never sign up alone — you set them up. Two minutes, and you&apos;ll have their first portfolio ready.
            </p>
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <Button variant="primary" size="lg" icon="plus" onClick={onAddChild}>Add a child</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {/* hero greeting */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22, padding: "clamp(20px, 5vw, 40px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "auto -10% -100% auto", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, var(--coral-mute) 0%, transparent 65%)" }} />
        <div style={{ position: "relative" }}>
          <div className="plm-eyebrow">Hi, {user.fullName.split(" ")[0]}</div>
          {pendingCount > 0 ? (
            <h1 className="plm-display-2" style={{ fontSize: "clamp(28px, 7vw, 52px)", marginTop: 16 }}>
              <span style={{ color: "var(--coral)", fontStyle: "italic" }}>{pendingCount}</span> {pendingCount === 1 ? "win" : "wins"} waiting for your nod.
            </h1>
          ) : (
            <h1 className="plm-display-2" style={{ fontSize: "clamp(28px, 7vw, 52px)", marginTop: 16 }}>
              The queue is <span style={{ color: "var(--sage)", fontStyle: "italic" }}>clear</span>.
            </h1>
          )}
          <p style={{ fontSize: 16, color: "var(--ink-soft)", marginTop: 16, maxWidth: 540 }}>
            {pendingCount > 0
              ? "A quick review takes about 90 seconds. Approve to publish, edit to refine, or reject to remove."
              : "Nothing waiting for review. Log a win on their behalf, or add another child to the family."}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            {pendingCount > 0 ? (
              <Button variant="primary" iconRight="arrowRight" onClick={onOpenReview}>Open review queue</Button>
            ) : (
              <Button variant="primary" icon="plus" onClick={onUpload}>Log a win on their behalf</Button>
            )}
            <Button variant="cream" icon="users" onClick={onAddChild}>Add a child</Button>
          </div>
        </div>
      </div>

      {/* metric tiles */}
      <div className="plm-grid-4">
        <MetricCard label="Children"        value={links.length}    icon="users"        tone="neutral" />
        <MetricCard label="Achievements"    value={totalAch}        icon="trophy"       tone="coral" />
        <MetricCard label="Public profiles" value={publicProfiles}  icon="globe"        tone="amber" sub={`of ${links.length}`} />
        <MetricCard label="Pending review"  value={pendingCount}    icon="checkCircle"  tone={pendingCount > 0 ? "danger" : "sage"} />
      </div>

      {/* children + activity */}
      <div className="plm-cols-split">
        <Card padding={0}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="plm-display-3" style={{ fontSize: 20 }}>Your children</div>
              <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>Tap a card to manage their profile</div>
            </div>
            <Button variant="cream" size="sm" icon="plus" onClick={onAddChild}>Add child</Button>
          </div>
          <div>
            {links.map((l, i) => {
              const p = l.child.childProfile;
              return (
                <button
                  key={l.id}
                  onClick={() => onSelectKid(l.child.id)}
                  className="plm-kid-row"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "clamp(14px, 4vw, 20px) clamp(14px, 4vw, 24px)",
                    borderBottom: i < links.length - 1 ? "1px solid var(--line)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "background 0.15s ease",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="plm-kid-row-avatar" style={{ flexShrink: 0 }}>
                    <ProfileAvatar name={l.child.fullName} photoUrl={p?.photoUrl} size={48} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="plm-display-3" style={{ fontSize: "clamp(15px, 4vw, 18px)" }}>{l.child.fullName}</span>
                      {p?.isPublic ? <Badge tone="success" dot>Public</Badge> : <Badge tone="neutral" dot>Private</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p ? `Age ${p.age}${p.grade ? ` · ${p.grade}` : ""} · ${p.school}` : "No profile yet"}
                    </div>
                    {p?.skills.length ? (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {p.skills.slice(0, 3).map((s) => <Chip key={s} size="sm" tone="neutral">{s}</Chip>)}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 0 }}>
                    <div className="plm-display" style={{ fontSize: "clamp(22px, 5vw, 32px)", lineHeight: 1 }}>{l.child.achievements.length}</div>
                    <div className="plm-eyebrow" style={{ fontSize: 10 }}>wins</div>
                  </div>
                  <Icon name="chevronRight" size={16} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)" }}>
            <div className="plm-display-3" style={{ fontSize: 20 }}>Recent activity</div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>Across all your children</div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {recent.length === 0 ? (
              <div style={{ padding: 24, color: "var(--ink-mute)", fontSize: 13, textAlign: "center" }}>No activity yet.</div>
            ) : recent.map((a, i) => {
              const m = categoryMeta(a.category);
              return (
                <div key={a.id} style={{ padding: "14px 24px", display: "flex", gap: 12, borderBottom: i < recent.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <CategoryIcon meta={m} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{a.kid.fullName.split(" ")[0]}</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span>{relativeTime(a.createdAt)}</span>
                      {!a.isApproved ? <Badge tone="warn">Pending</Badge> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* category breakdown */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="plm-eyebrow">Family ledger</div>
            <div className="plm-display-3" style={{ fontSize: 22, marginTop: 8 }}>Wins by category</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip tone="ghost" size="sm" icon="filter">All time</Chip>
            <Chip tone="ghost" size="sm">All children</Chip>
          </div>
        </div>
        <CategoryBars links={links} />
      </Card>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, tone = "neutral" }: { label: string; value: number; sub?: string; icon: IconName; tone?: "neutral" | "coral" | "amber" | "sage" | "danger" }) {
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
      <div className="plm-display" style={{ fontSize: "clamp(24px, 5.5vw, 44px)", marginTop: 8, color: "var(--ink)" }}>
        <Count to={value} />
      </div>
      {sub ? <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{sub}</div> : null}
    </Card>
  );
}

function CategoryIcon({ meta, size = 36 }: { meta: ReturnType<typeof categoryMeta>; size?: number }) {
  const inner = size === 36 ? 16 : 14;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 10,
        background: meta.tone === "neutral" ? "var(--surface-2)" : meta.tone === "teal" ? "var(--teal-soft)" : `var(--${meta.tone}-soft)`,
        color: meta.tone === "neutral" ? "var(--ink-soft)" : meta.tone === "teal" ? "var(--teal)" : `var(--${meta.tone})`,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon name={meta.icon} size={inner} strokeWidth={1.9} />
    </div>
  );
}

function CategoryBars({ links }: { links: ParentChildLink[] }) {
  const counts = CATEGORIES.map((c) => ({
    ...c,
    n: links.flatMap((l) => l.child.achievements).filter((a) => a.category === c.value).length,
  }));
  const max = Math.max(...counts.map((c) => c.n), 1);
  return (
    <div className="plm-cat-bars">
      {counts.map((c) => (
        <div key={c.value} style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", height: 120, padding: "0 4px" }}>
            <div
              style={{
                width: "100%",
                height: `${Math.max(8, (c.n / max) * 100)}%`,
                background: c.tone === "neutral" ? "var(--line-strong)" : c.tone === "teal" ? "var(--teal)" : `var(--${c.tone})`,
                borderRadius: "10px 10px 4px 4px",
                transition: "height 0.6s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)", minWidth: 0 }}>
            <Icon name={c.icon} size={13} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />
            <span className="plm-cat-bars-label" style={{ fontSize: 12, fontWeight: 500 }}>{c.label}</span>
          </div>
          <div className="plm-display" style={{ fontSize: 24, marginTop: 4 }}>{c.n}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Children tab ---------- */

function ParentChildren({
  links,
  selectedChildId,
  onSelect,
  onAddChild,
  onEdit,
  search,
  reload,
  setMessage,
  setError,
}: {
  links: ParentChildLink[];
  selectedChildId: string | null;
  onSelect: (id: string) => void;
  onAddChild: () => void;
  onEdit: (id: string) => void;
  search: string;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const q = search.trim().toLowerCase();
  const filteredLinks = q
    ? links.filter((l) =>
        l.child.fullName.toLowerCase().includes(q) ||
        l.child.email.toLowerCase().includes(q) ||
        l.child.childProfile?.school.toLowerCase().includes(q) ||
        l.child.childProfile?.skills.some((s) => s.toLowerCase().includes(q))
      )
    : links;

  const link = filteredLinks.find((l) => l.child.id === selectedChildId)
    ?? filteredLinks[0]
    ?? links.find((l) => l.child.id === selectedChildId)
    ?? links[0];
  if (!link) return <Empty icon="users" title="No children yet" sub="Add your first child to begin." action={<Button variant="primary" icon="plus" onClick={onAddChild}>Add a child</Button>} />;
  const kid = link.child;
  const profile = kid.childProfile;

  async function updateVisibility(patch: { isPublic?: boolean; accessApproved?: boolean; requireApproval?: boolean }) {
    const res = await fetch(`/api/children/${kid.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { setError("Couldn't update settings."); return; }
    setMessage("Settings saved.");
    await reload();
  }

  async function updatePhoto(url: string) {
    const res = await fetch(`/api/children/${kid.id}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: url }),
    });
    if (!res.ok) { setError("Couldn't save photo."); return; }
    setMessage("Photo updated.");
    await reload();
  }

  return (
    <div className="plm-cols-sidebar">
      <ChildSwitcher
        kids={filteredLinks}
        allCount={links.length}
        selectedId={kid.id}
        onSelect={onSelect}
        onAddChild={onAddChild}
        searchMissed={search.trim().length > 0 && filteredLinks.length === 0}
        search={search}
      />

      <Card padding={0}>
        <div style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3.5vw, 28px)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div style={{ position: "relative" }}>
              <ProfileAvatar name={kid.fullName} photoUrl={profile?.photoUrl} size={68} ring />
              <PhotoUploadButton onUploaded={updatePhoto} onError={(m) => setError(m)} />
            </div>
            <div>
              <div className="plm-display-2" style={{ fontSize: 32 }}>{kid.fullName}</div>
              <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
                {kid.email} · {lastActiveLabel(kid.lastActiveAt)}
              </div>
              {profile ? (
                <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                  <Chip size="sm" icon="cake">{profile.age} years</Chip>
                  {profile.grade ? <Chip size="sm" icon="school">{profile.grade}</Chip> : null}
                  {profile.location ? <Chip size="sm" icon="pin">{profile.location}</Chip> : null}
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="cream" size="sm" icon="edit" onClick={() => onEdit(kid.id)}>Edit profile</Button>
            {profile?.isPublic ? (
              <Link href={`/p/${kid.id}`} target="_blank">
                <Button variant="primary" size="sm" icon="globe" iconRight="arrowUpRight">View public</Button>
              </Link>
            ) : (
              <Button variant="primary" size="sm" icon="globe" onClick={() => setError("This profile is private. Turn on Public profile to share it.")}>
                View public
              </Button>
            )}
          </div>
        </div>

        {profile ? (
          <>
            <div className="plm-grid-2" style={{ padding: 28, gap: 28 }}>
              <div>
                <div className="plm-eyebrow" style={{ marginBottom: 12 }}>Privacy controls</div>
                <div style={{ display: "grid", gap: 14 }}>
                  <Card padding={16} style={{ background: profile.isPublic ? "var(--sage-soft)" : "var(--surface-2)", borderColor: profile.isPublic ? "#6EE7B7" : "var(--line)" }}>
                    <Toggle
                      checked={profile.isPublic}
                      onChange={(v) => updateVisibility({ isPublic: v })}
                      label="Public profile"
                      sublabel={profile.isPublic ? `plume.app/p/${kid.id} — anyone with the link can view` : "Only you can see this profile"}
                    />
                  </Card>
                  <Card padding={16}>
                    <Toggle
                      checked={link.accessApproved}
                      onChange={(v) => updateVisibility({ accessApproved: v })}
                      label="Allow child to sign in"
                      sublabel={link.accessApproved ? "They can log in with their own credentials" : "Child sign-in is paused"}
                    />
                  </Card>
                  <Card padding={16}>
                    <Toggle
                      checked={profile.requireApproval}
                      onChange={(v) => updateVisibility({ requireApproval: v })}
                      label="Require parent approval for new wins"
                      sublabel={profile.requireApproval ? "Uploads enter the review queue first" : "Uploads go live straight away"}
                    />
                  </Card>
                </div>
              </div>
              <div>
                <div className="plm-eyebrow" style={{ marginBottom: 12 }}>Profile fields</div>
                <Field label="About" value={profile.bio} icon="quote" />
                <Field label="Fun fact" value={profile.funFact} icon="spark" />
                <Field label="Skills" value={profile.skills.join(" · ")} icon="star" />
                <Field label="Interests" value={profile.interests.join(" · ")} icon="bookmark" />
              </div>
            </div>

            <div style={{ padding: "clamp(14px, 3vw, 20px) clamp(16px, 3.5vw, 28px)", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div className="plm-display-3" style={{ fontSize: 20 }}>Achievements ({kid.achievements.length})</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CATEGORIES.slice(0, 5).map((c) => (
                    <Chip key={c.value} size="sm" tone="ghost" icon={c.icon}>
                      {kid.achievements.filter((a) => a.category === c.value).length}
                    </Chip>
                  ))}
                </div>
              </div>
              {kid.achievements.length === 0 ? (
                <Empty icon="trophy" title="No achievements yet" sub="Use ‘Log a win’ in the top right to add the first one." />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {kid.achievements.map((a) => (
                    <AchievementRow
                      key={a.id}
                      achievement={a}
                      reload={reload}
                      setMessage={setMessage}
                      setError={setError}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <Empty icon="user" title="No profile data" sub="Set up the profile to begin." />
        )}
      </Card>
    </div>
  );
}

function ChildSwitcher({
  kids,
  allCount,
  selectedId,
  onSelect,
  onAddChild,
  searchMissed,
  search,
}: {
  kids: ParentChildLink[];
  allCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onAddChild: () => void;
  searchMissed: boolean;
  search: string;
}) {
  return (
    <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
      {searchMissed ? (
        <div style={{ padding: 14, border: "1px dashed var(--line-strong)", borderRadius: 14, color: "var(--ink-mute)", fontSize: 12, textAlign: "center" }}>
          No children match “{search}”.
        </div>
      ) : null}
      {kids.map((l) => {
        const active = l.child.id === selectedId;
        const p = l.child.childProfile;
        return active ? (
          <button
            key={l.id}
            onClick={() => onSelect(l.child.id)}
            aria-label={`${l.child.fullName} (selected)`}
            style={{
              position: "relative",
              padding: 18,
              borderRadius: 18,
              minHeight: 240,
              background: p?.photoUrl ? "var(--ink)" : "var(--ink)",
              backgroundImage: p?.photoUrl ? `linear-gradient(180deg, rgba(15,23,42,0.0) 30%, rgba(15,23,42,0.85) 100%), url("${p.photoUrl}")` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "var(--surface)",
              border: "1px solid var(--ink)",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <ProfileAvatar name={l.child.fullName} photoUrl={p?.photoUrl} size={44} />
            <div>
              <div className="plm-display-3" style={{ fontSize: 20, color: "var(--surface)" }}>{l.child.fullName}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                {p?.grade ? `${p.grade} · ` : ""}{l.child.achievements.length} wins
              </div>
            </div>
          </button>
        ) : (
          <button
            key={l.id}
            onClick={() => onSelect(l.child.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <ProfileAvatar name={l.child.fullName} photoUrl={p?.photoUrl} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{l.child.fullName}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                {p?.grade ? `${p.grade} · ` : ""}{l.child.achievements.length} wins
              </div>
            </div>
            {!p?.isPublic ? <Icon name="lock" size={14} style={{ color: "var(--ink-faint)" }} /> : null}
          </button>
        );
      })}
      <button
        onClick={onAddChild}
        style={{
          padding: 14,
          border: "1px dashed var(--line-strong)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--ink-soft)",
          fontSize: 13,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={14} /> Add a child{allCount > 0 ? "" : ""}
      </button>
    </div>
  );
}

function PhotoUploadButton({
  onUploaded,
  onError,
}: {
  onUploaded: (url: string) => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--ink)",
        color: "var(--surface)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid var(--surface)",
        cursor: "pointer",
        overflow: "hidden",
      }}
      title="Change photo"
    >
      <FileUploadButton
        kind="photo"
        label=""
        icon="image"
        variant="primary"
        size="sm"
        onUploaded={onUploaded}
        onError={onError}
      />
    </div>
  );
}

function AchievementRow({
  achievement,
  reload,
  setMessage,
  setError,
}: {
  achievement: Achievement;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const m = categoryMeta(achievement.category);

  async function toggleApproved() {
    setMenuOpen(false);
    const res = await fetch(`/api/admin/achievements/${achievement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !achievement.isApproved }),
    });
    if (!res.ok) { setError("Couldn't update approval."); return; }
    setMessage(achievement.isApproved ? "Moved back to pending." : "Approved · published.");
    await reload();
  }

  async function deleteAchievement() {
    setMenuOpen(false);
    if (!window.confirm(`Delete “${achievement.title}”? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/achievements/${achievement.id}`, { method: "DELETE" });
    if (!res.ok) { setError("Couldn't delete."); return; }
    setMessage("Achievement deleted.");
    await reload();
  }

  return (
    <>
      <div style={{ padding: 16, border: "1px solid var(--line)", borderRadius: 12, display: "flex", alignItems: "center", gap: 14, background: "var(--surface-2)" }}>
        <CategoryIcon meta={m} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{achievement.title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{m.label} · {formatDate(achievement.createdAt)}</div>
        </div>
        {achievement.isApproved ? <Badge tone="success" dot>Approved</Badge> : <Badge tone="warn" dot>Pending</Badge>}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More options"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-mute)",
              background: "transparent",
            }}
            onBlur={(e) => {
              if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                setTimeout(() => setMenuOpen(false), 120);
              }
            }}
          >
            <Icon name="moreHorizontal" size={16} />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: 38,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                boxShadow: "var(--shadow-lg)",
                padding: 6,
                minWidth: 180,
                zIndex: 5,
              }}
            >
              <MenuItem icon="edit" onClick={() => { setMenuOpen(false); setEditing(true); }}>Edit</MenuItem>
              <MenuItem icon={achievement.isApproved ? "clock" : "check"} onClick={toggleApproved}>
                {achievement.isApproved ? "Mark as pending" : "Approve & publish"}
              </MenuItem>
              <MenuItem icon="trash" tone="danger" onClick={deleteAchievement}>Delete</MenuItem>
            </div>
          ) : null}
        </div>
      </div>

      {editing ? (
        <EditAchievementModal
          open={true}
          onClose={() => setEditing(false)}
          achievement={achievement}
          onSaved={async ({ approved }) => {
            await reload();
            setMessage(approved ? "Edited · approved · published." : "Edits saved.");
          }}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </>
  );
}

function MenuItem({
  icon,
  tone,
  onClick,
  children,
}: {
  icon: IconName;
  tone?: "danger";
  onClick: () => void;
  children: ReactNode;
}) {
  const color = tone === "danger" ? "var(--coral-deep)" : "var(--ink)";
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        width: "100%",
        fontSize: 13,
        color,
        background: "transparent",
        textAlign: "left",
      }}
    >
      <Icon name={icon} size={14} />
      {children}
    </button>
  );
}

/* ---------- Review queue ---------- */

function ParentReview({
  links,
  search,
  reload,
  setMessage,
  setError,
  onApproved,
  onEditFirst,
}: {
  links: ParentChildLink[];
  search: string;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
  onApproved: () => void;
  onEditFirst: (a: Achievement) => void;
}) {
  const q = search.trim().toLowerCase();
  const allPending = links.flatMap((l) =>
    l.child.achievements.filter((a) => !a.isApproved).map((a) => ({ ...a, kid: l.child }))
  );
  const pending = q
    ? allPending.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        a.kid.fullName.toLowerCase().includes(q)
      )
    : allPending;

  if (allPending.length === 0) {
    return (
      <Empty
        icon="checkCircle"
        title="All caught up."
        sub="No wins are waiting for your review right now. We'll let you know when there are."
      />
    );
  }

  async function approve(a: Achievement) {
    const res = await fetch(`/api/admin/achievements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true }),
    });
    if (!res.ok) { setError("Couldn't approve. Try again."); return; }
    setMessage("Approved · published.");
    onApproved();
    await reload();
  }

  async function reject(a: Achievement) {
    const res = await fetch(`/api/admin/achievements/${a.id}`, { method: "DELETE" });
    if (!res.ok) { setError("Couldn't remove. Try again."); return; }
    setMessage("Removed from queue.");
    await reload();
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Review queue"
        title={`${allPending.length} item${allPending.length === 1 ? "" : "s"} to review`}
        sub="Each one was submitted by your child. Approve to publish, edit to refine, or reject to remove."
      />
      {pending.length === 0 ? (
        <Empty icon="search" title="No matches" sub={`No pending wins match “${search}”.`} />
      ) : null}
      <div style={{ display: "grid", gap: 16 }}>
        {pending.map((a) => {
          const m = categoryMeta(a.category);
          return (
            <Card key={a.id} padding={0}>
              <div className="plm-review-card">
                {a.proofFileUrl && !a.proofFileUrl.endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.proofFileUrl} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "18px 0 0 18px" }} />
                ) : (
                  <ImgPlaceholder
                    label={a.proofFileUrl ? "PDF certificate" : a.proofUrl ? "external link" : "no proof"}
                    aspect="1 / 1"
                    tone={m.tone === "neutral" || m.tone === "teal" ? "cream" : m.tone}
                    style={{ borderRadius: "18px 0 0 18px" }}
                  />
                )}
                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip size="sm" icon={m.icon} tone={m.tone}>{m.label}</Chip>
                    <Badge tone="warn" dot>Submitted by {a.kid.fullName.split(" ")[0]}</Badge>
                    <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{relativeTime(a.createdAt)}</span>
                  </div>
                  <div className="plm-display-3" style={{ fontSize: 24, marginTop: 12 }}>{a.title}</div>
                  {a.description ? <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>{a.description}</p> : null}
                  {a.proofUrl ? (
                    <a href={a.proofUrl} target="_blank" rel="noreferrer noopener" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 13, color: "var(--coral-deep)", textDecoration: "underline" }}>
                      <Icon name="link" size={14} /> External link
                    </a>
                  ) : null}
                </div>
                <div style={{ padding: 22, borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", minWidth: 200 }}>
                  <Button variant="primary" icon="check" full onClick={() => approve(a)}>Approve</Button>
                  <Button variant="outline" icon="edit" full onClick={() => onEditFirst(a)}>Edit first</Button>
                  <Button variant="danger"  icon="x"     full onClick={() => reject(a)}>Reject</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function ParentReports({
  links,
  search,
  setError,
}: {
  links: ParentChildLink[];
  search: string;
  setError: (v: string | null) => void;
}) {
  const q = search.trim().toLowerCase();
  const filtered = q ? links.filter((l) => l.child.fullName.toLowerCase().includes(q)) : links;

  if (links.length === 0) {
    return <Empty icon="activity" title="No children yet" sub="Add a child first, then come back to export their year-in-review." />;
  }

  function openReport(childId: string, range: string) {
    const url = `/api/reports/${childId}?range=${encodeURIComponent(range)}`;
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) setError("Couldn't open the report — check your popup blocker.");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionHeader
        eyebrow="Reports"
        title="Year-in-review exports"
        sub="Generate a clean PDF of any child's year — perfect for school applications, scholarship submissions, or end-of-year keepsakes."
      />
      {filtered.length === 0 ? (
        <Empty icon="search" title="No matches" sub={`No children match “${search}”.`} />
      ) : (
        <div className="plm-grid-2">
          {filtered.map((l) => (
            <ReportCard key={l.id} link={l} onExport={openReport} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  link, onExport,
}: {
  link: ParentChildLink;
  onExport: (childId: string, range: string) => void;
}) {
  const [range, setRange] = useState("school-2025");
  const approvedCount = link.child.achievements.filter((a) => a.isApproved).length;
  const cats = new Set(link.child.achievements.filter((a) => a.isApproved).map((a) => a.category));
  return (
    <Card padding={28}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <ProfileAvatar name={link.child.fullName} photoUrl={link.child.childProfile?.photoUrl} size={48} />
        <div>
          <div className="plm-display-3" style={{ fontSize: 20 }}>{link.child.fullName}</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            {approvedCount} achievement{approvedCount === 1 ? "" : "s"} · {cats.size || 0} categor{cats.size === 1 ? "y" : "ies"}
          </div>
        </div>
      </div>
      <ImgPlaceholder label="report preview" aspect="16 / 11" tone="cream" />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <select
          value={range}
          onChange={(e) => setRange(e.currentTarget.value)}
          aria-label={`Date range for ${link.child.fullName}'s report`}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: "var(--paper)",
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          <option value="school-2025">2025 — 2026 (school year)</option>
          <option value="calendar-2025">Calendar 2025</option>
          <option value="all">All time</option>
        </select>
        <Button variant="primary" size="sm" icon="download" onClick={() => onExport(link.child.id, range)}>
          Export PDF
        </Button>
      </div>
    </Card>
  );
}

function ParentSettings({
  user,
  links,
  reload,
  setMessage,
  setError,
  onLogout,
}: {
  user: User;
  links: ParentChildLink[];
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
  onLogout: () => void;
}) {
  const [digest, setDigest] = useLocalBool("parent.weeklyDigest", true);
  const [approvals, setApprovals] = useLocalBool("parent.approvalAlerts", true);
  const [discovery, setDiscovery] = useLocalBool("parent.publicDiscovery", false);

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<null | "pause" | "resume" | "delete">(null);

  const anyPaused = links.some((l) => !l.accessApproved);

  async function saveProfile() {
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Couldn't save changes.");
      return;
    }
    setMessage("Account details saved.");
    await reload();
  }

  async function toggleChildAccess(pause: boolean) {
    if (links.length === 0) {
      setError("You don't have any children yet.");
      return;
    }
    setBusy(pause ? "pause" : "resume");
    const res = await fetch("/api/parent/pause-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: pause }),
    });
    setBusy(null);
    if (!res.ok) { setError(`Couldn't ${pause ? "pause" : "resume"} child accounts.`); return; }
    setMessage(pause ? "All child accounts paused." : "All child accounts resumed.");
    await reload();
  }

  async function deleteAccount() {
    const confirmation = window.prompt(
      "This permanently deletes your account, your children's accounts, and every upload within 24 hours. Type DELETE to confirm:"
    );
    if (confirmation !== "DELETE") return;
    setBusy("delete");
    const res = await fetch("/api/me", { method: "DELETE" });
    setBusy(null);
    if (!res.ok) { setError("Couldn't delete account. Try again."); return; }
    setMessage("Family account deleted.");
    onLogout();
  }

  return (
    <div className="plm-grid-2">
      <Card>
        <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 16 }}>Account</div>
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="Your name" icon="user" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} minLength={2} maxLength={80} />
          <Input label="Email" icon="mail" value={user.email} readOnly hint="Email changes are managed by an admin — contact support to update." />
          <Input label="Phone (optional)" icon="phone" placeholder="+971 50 ••• ••82" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} maxLength={40} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" icon="check" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 16 }}>Preferences</div>
        <div style={{ display: "grid", gap: 16 }}>
          <Toggle checked={digest}    onChange={setDigest}    label="Weekly digest email"      sublabel="A summary of your kids' week, every Sunday at 8pm" />
          <Toggle checked={approvals} onChange={setApprovals} label="Approval notifications"   sublabel="Alert me when a child uploads something new" />
          <Toggle checked={discovery} onChange={setDiscovery} label="Public discovery"          sublabel="Allow schools to find your child's profile — off by default" />
        </div>
      </Card>

      <Card style={{ gridColumn: "span 2" }}>
        <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 16 }}>Danger zone</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--surface-2)", borderRadius: 12, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{anyPaused ? "Resume all child accounts" : "Pause all child accounts"}</div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                {anyPaused
                  ? "Some or all of your children currently can't sign in. Resume to allow them back."
                  : "Prevents all your children from signing in until you turn it back on."}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleChildAccess(!anyPaused)}
              disabled={busy === "pause" || busy === "resume" || links.length === 0}
            >
              {busy === "pause" ? "Pausing…" : busy === "resume" ? "Resuming…" : anyPaused ? "Resume" : "Pause"}
            </Button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--coral-mute)", borderRadius: 12, border: "1px solid var(--coral-soft)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--coral-deep)" }}>Delete family account</div>
              <div style={{ fontSize: 12, color: "var(--coral-deep)", opacity: 0.8 }}>
                All profiles and uploads are permanently deleted within 24 hours.
              </div>
            </div>
            <Button variant="danger" size="sm" icon="trash" onClick={deleteAccount} disabled={busy === "delete"}>
              {busy === "delete" ? "Deleting…" : "Delete…"}
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ gridColumn: "span 2" }}>
        <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 16 }}>Family agreement</div>
        <ul style={{ fontSize: 13, color: "var(--ink-soft)", padding: 0, listStyle: "none", margin: 0, display: "grid", gap: 8 }}>
          <li style={{ display: "flex", gap: 10 }}><Icon name="check" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} strokeWidth={2.4} /> Children never sign up alone. You are always the account holder.</li>
          <li style={{ display: "flex", gap: 10 }}><Icon name="check" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} strokeWidth={2.4} /> You can read, edit, delete, or hide any content your child uploads.</li>
          <li style={{ display: "flex", gap: 10 }}><Icon name="check" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} strokeWidth={2.4} /> Profiles are private until you turn public access on.</li>
          <li style={{ display: "flex", gap: 10 }}><Icon name="check" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 3 }} strokeWidth={2.4} /> We never sell or share data. Ever.</li>
        </ul>
      </Card>
    </div>
  );
}
