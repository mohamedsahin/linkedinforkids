"use client";

/* Child's own view of the dashboard */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/app/components/icons";
import {
  Button, Card, Chip, Badge, Empty, ImgPlaceholder, ProgressLine,
  CATEGORIES, categoryMeta,
} from "@/app/components/ui";
import { ProfileAvatar } from "@/app/components/profile-avatar";
import { FileUploadButton } from "@/app/components/file-upload-button";
import { Confetti } from "@/app/components/confetti";
import { computeGameState } from "@/lib/gamification";
import { MeResponse, User, Achievement, ChildProfileData, formatDate, relativeTime } from "./shared";
import { DashboardShell, SidebarItem } from "./shell";
import { AchievementModal, ReflectionModal, reflectionPromptForToday } from "./modals";

type Tab = "home" | "achievements" | "badges" | "profile";

export function ChildDashboard({
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
  const profile = meData?.childData?.profile ?? null;
  const achievements = useMemo(() => meData?.childData?.achievements ?? [], [meData?.childData?.achievements]);
  const [tab, setTab] = useState<Tab>("home");
  const [openUpload, setOpenUpload] = useState(false);
  const [openReflection, setOpenReflection] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [search, setSearch] = useState("");
  const filteredAchievements = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return achievements;
    return achievements.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [achievements, search]);

  const game = useMemo(
    () => computeGameState(profile, achievements.map((a) => ({ category: a.category, isApproved: a.isApproved }))),
    [profile, achievements]
  );

  const sidebar: SidebarItem[] = [
    { id: "home",         label: "Home",       icon: "home" },
    { id: "achievements", label: "My wins",    icon: "trophy", count: achievements.length },
    { id: "badges",       label: "Badges",     icon: "award" },
    { id: "profile",      label: "My profile", icon: "user" },
  ];
  const labels: Record<Tab, string> = { home: "Home", achievements: "My wins", badges: "Badges", profile: "My profile" };

  return (
    <DashboardShell
      role="CHILD"
      user={user}
      sidebar={sidebar}
      active={tab}
      onSelect={(id) => { setTab(id as Tab); setSearch(""); }}
      currentScreenLabel={labels[tab]}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={tab === "achievements" ? "Search your wins…" : "Search…"}
      onLogout={onLogout}
      headerRight={<Button variant="primary" size="sm" icon="plus" onClick={() => setOpenUpload(true)}>Add a win</Button>}
    >
      {tab === "home"         ? <ChildHome         user={user} profile={profile} achievements={achievements} game={game} onUpload={() => setOpenUpload(true)} onReflect={() => setOpenReflection(true)} setTab={setTab} /> : null}
      {tab === "achievements" ? <ChildAchievements achievements={filteredAchievements} totalCount={achievements.length} onUpload={() => setOpenUpload(true)} /> : null}
      {tab === "badges"       ? <ChildBadges game={game} /> : null}
      {tab === "profile"      ? (
        <ChildProfile
          user={user}
          profile={profile}
          achievements={achievements}
          game={game}
          reload={reload}
          setMessage={setMessage}
          setError={setError}
        />
      ) : null}

      <AchievementModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        // eslint-disable-next-line react/no-children-prop
        children={[{ id: user.id, name: user.fullName }]}
        mode="child"
        onCreated={async () => {
          await reload();
          setMessage("Sent to Mum & Dad for approval.");
          setCelebrate((n) => n + 1);
        }}
        onError={(m) => setError(m)}
      />

      <ReflectionModal
        open={openReflection}
        onClose={() => setOpenReflection(false)}
        childId={user.id}
        prompt={reflectionPromptForToday()}
        onSaved={() => setMessage("Reflection saved · only on this device.")}
      />

      <Confetti trigger={celebrate} />
    </DashboardShell>
  );
}

function ChildHome({
  user, profile, achievements, game, onUpload, onReflect, setTab,
}: {
  user: User;
  profile: ChildProfileData | null;
  achievements: Achievement[];
  game: ReturnType<typeof computeGameState>;
  onUpload: () => void;
  onReflect: () => void;
  setTab: (t: Tab) => void;
}) {
  const approved = achievements.filter((a) => a.isApproved);
  const pending  = achievements.filter((a) => !a.isApproved);
  const first    = user.fullName.split(" ")[0];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* hero */}
      <div className="plm-cols-split">
        <div style={{ background: "var(--ink)", color: "var(--surface)", borderRadius: 22, padding: "clamp(20px, 5vw, 40px)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "-20% -10% auto auto", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, var(--coral) 0%, transparent 70%)", opacity: 0.4 }} />
          <div style={{ position: "relative" }}>
            <div className="plm-eyebrow" style={{ color: "var(--amber-soft)" }}>Hi, {first}</div>
            <div className="plm-display-2" style={{ fontSize: "clamp(24px, 5.5vw, 44px)", marginTop: 8, color: "var(--surface)" }}>
              You&apos;re a <span style={{ fontStyle: "italic", color: "var(--amber-soft)" }}>level {game.level.level}</span> {game.level.name}.
            </div>
            <p style={{ fontSize: 15, opacity: 0.7, marginTop: 12, maxWidth: 480 }}>
              {pending.length > 0
                ? `${pending.length} of your wins ${pending.length === 1 ? "is" : "are"} with your parents for approval.`
                : "You're all caught up. Keep going."}
              {game.nextLevel ? ` ${game.xpForNextLevel - game.xpIntoLevel} XP to ${game.nextLevel.name}.` : " You're at the top level!"}
            </p>
            <div style={{ marginTop: 24, padding: 20, background: "rgba(255, 255, 255, 0.08)", borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.14)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="plm-display" style={{ fontSize: "clamp(22px, 4.5vw, 36px)", color: "var(--surface)" }}>{game.xp.toLocaleString()} XP</div>
                {game.nextLevel ? <div style={{ fontSize: 13, opacity: 0.6 }}>{(game.nextLevel.floor).toLocaleString()} XP to {game.nextLevel.name}</div> : <div style={{ fontSize: 13, opacity: 0.6 }}>Max level</div>}
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgressLine value={game.levelProgress} tone="coral" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", opacity: 0.5, textTransform: "uppercase" }}>
                <span>{game.level.name}</span>
                <span>{game.nextLevel?.name ?? "Top"}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <Card padding={24}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="plm-eyebrow">Approved wins</div>
              <Icon name="checkCircle" size={16} style={{ color: "var(--sage)" }} />
            </div>
            <div className="plm-display" style={{ fontSize: "clamp(26px, 6.5vw, 48px)", marginTop: 8 }}>{approved.length}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>Live on your portfolio</div>
          </Card>
          <Card padding={24} style={{ background: "var(--amber-mute)", borderColor: "var(--amber-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="plm-eyebrow" style={{ color: "#92400E" }}>Pending</div>
              <Icon name="clock" size={16} style={{ color: "var(--amber)" }} />
            </div>
            <div className="plm-display" style={{ fontSize: "clamp(26px, 6.5vw, 48px)", marginTop: 8, color: "var(--ink)" }}>{pending.length}</div>
            <div style={{ fontSize: 12, color: "#92400E" }}>Waiting for parent approval</div>
          </Card>
        </div>
      </div>

      {/* profile completion */}
      {profile ? (
        <Card padding={28} style={{ background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="plm-eyebrow">Profile power</div>
              <div className="plm-display-3" style={{ fontSize: 22, marginTop: 8 }}>You&apos;re {game.completion}% complete.</div>
              <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 6 }}>
                {game.completionItems.find((i) => !i.done) ? `Next: ${game.completionItems.find((i) => !i.done)!.label}` : "Your profile is filled out beautifully."}
              </div>
              <div style={{ marginTop: 14 }}>
                <ProgressLine value={game.completion} tone="coral" />
              </div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {game.completionItems.slice(0, 5).map((it) => (
                <div key={it.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: it.done ? "var(--sage)" : "var(--ink-soft)" }}>
                  <Icon name={it.done ? "check" : "target"} size={14} strokeWidth={2.2} />
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* today's reflection */}
      <ReflectionCard childId={user.id} onReflect={onReflect} />

      {/* recent + suggestions */}
      <div className="plm-cols-split">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="plm-display-3" style={{ fontSize: 20 }}>Recent wins</div>
            <button onClick={() => setTab("achievements")} style={{ fontSize: 13, color: "var(--coral-deep)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              View all <Icon name="arrowRight" size={12} />
            </button>
          </div>
          {achievements.length === 0 ? (
            <Empty icon="trophy" title="No wins yet" sub="Tap ‘Add a win’ to log your first one." action={<Button variant="primary" icon="plus" onClick={onUpload}>Add a win</Button>} />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {achievements.slice(0, 4).map((a) => <AchievementRow key={a.id} ach={a} />)}
            </div>
          )}
        </div>

        <div>
          <div className="plm-display-3" style={{ fontSize: 20, marginBottom: 14 }}>Try next</div>
          <div style={{ display: "grid", gap: 10 }}>
            {suggestionsFor(achievements).map((s, i) => (
              <button
                key={i}
                onClick={onUpload}
                style={{ textAlign: "left", padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer" }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: s.tone === "teal" ? "var(--teal-soft)" : `var(--${s.tone}-soft)`,
                  color: s.tone === "teal" ? "var(--teal)" : `var(--${s.tone})`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name={s.icon} size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
                <Icon name="chevronRight" size={14} style={{ color: "var(--ink-faint)", marginTop: 12 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type Suggestion = { icon: IconName; title: string; desc: string; tone: "coral" | "amber" | "plum" | "sage" | "teal" };

function suggestionsFor(achievements: Achievement[]): Suggestion[] {
  const counts: Record<string, number> = {};
  for (const a of achievements) counts[a.category] = (counts[a.category] ?? 0) + 1;
  const approved: Record<string, number> = {};
  for (const a of achievements) if (a.isApproved) approved[a.category] = (approved[a.category] ?? 0) + 1;

  const out: Suggestion[] = [];

  // Music: nudge toward grade certificates
  if (counts.MUSIC && counts.MUSIC > 0) {
    out.push({
      icon: "music",
      tone: "sage",
      title: "Add your latest grade certificate",
      desc: `${counts.MUSIC} music win${counts.MUSIC === 1 ? "" : "s"} on file — log your next exam result while it's fresh.`,
    });
  } else {
    out.push({
      icon: "music",
      tone: "sage",
      title: "Capture your first music moment",
      desc: "A school assembly, a grade exam, or a song you wrote — any of it counts.",
    });
  }

  // Coding: show off a project
  if (counts.CODING && counts.CODING > 0) {
    out.push({
      icon: "code",
      tone: "teal",
      title: "Show your latest coding project",
      desc: "Add a screenshot or paste a link — even a small Scratch sketch is worth it.",
    });
  } else if (counts.ACADEMICS && counts.ACADEMICS > 0) {
    out.push({
      icon: "book",
      tone: "amber",
      title: "Add another report-card moment",
      desc: "Subjects, mock exams, anything you're proud of from this term.",
    });
  } else {
    out.push({
      icon: "code",
      tone: "teal",
      title: "Try a quick coding sketch",
      desc: "A Scratch project, a typed-up algorithm, or a small website you made.",
    });
  }

  // Arts: photograph more pieces toward the Curator badge (5 approved arts)
  const arts = approved.ARTS ?? 0;
  if (arts > 0 && arts < 5) {
    const need = 5 - arts;
    out.push({
      icon: "palette",
      tone: "plum",
      title: `Photograph ${need} more piece${need === 1 ? "" : "s"}`,
      desc: `You have ${arts} approved art win${arts === 1 ? "" : "s"} — photograph ${need} more to unlock the Curator badge.`,
    });
  } else if (counts.SPORTS && counts.SPORTS > 0) {
    out.push({
      icon: "trophy",
      tone: "coral",
      title: "Log your latest sports win",
      desc: "Tournaments, matches, PRs — anything new since last week.",
    });
  } else {
    out.push({
      icon: "palette",
      tone: "plum",
      title: "Show what you made",
      desc: "Photograph a piece, painting, or any creation.",
    });
  }

  return out;
}

function ReflectionCard({
  childId,
  onReflect,
}: {
  childId: string;
  onReflect: () => void;
}) {
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const now = new Date();
      const key = `plm.reflection.${childId}.${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt?: string };
        if (parsed.savedAt) setSavedAt(parsed.savedAt);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [childId]);

  const prompt = reflectionPromptForToday();

  return (
    <Card padding={28} style={{ background: "var(--surface-2)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="plm-eyebrow">Today&apos;s reflection</div>
          <div className="plm-display-3" style={{ fontSize: 22, marginTop: 8, lineHeight: 1.3 }}>{prompt}</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 8 }}>
            {savedAt
              ? `Saved ${relativeTime(savedAt)} · only on this device.`
              : "You don't have to add this to your portfolio. Just write it down for yourself."}
          </div>
        </div>
        <Button variant="primary" size="sm" icon="edit" onClick={onReflect}>
          {savedAt ? "Edit" : "Reflect"}
        </Button>
      </div>
    </Card>
  );
}

function AchievementRow({ ach }: { ach: Achievement }) {
  const m = categoryMeta(ach.category);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14 }}>
      <div
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: m.tone === "neutral" ? "var(--surface-2)" : m.tone === "teal" ? "var(--teal-soft)" : `var(--${m.tone}-soft)`,
          color: m.tone === "neutral" ? "var(--ink-soft)" : m.tone === "teal" ? "var(--teal)" : `var(--${m.tone})`,
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Icon name={m.icon} size={18} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{ach.title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{m.label} · {formatDate(ach.createdAt)}</div>
      </div>
      {ach.isApproved ? <Badge tone="success" dot>Approved</Badge> : <Badge tone="warn" dot>Pending</Badge>}
    </div>
  );
}

function ChildAchievements({ achievements, totalCount, onUpload }: { achievements: Achievement[]; totalCount: number; onUpload: () => void }) {
  const [filter, setFilter] = useState<string>("ALL");
  const list = filter === "ALL" ? achievements : achievements.filter((a) => a.category === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="plm-eyebrow">My wins</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(22px, 4.5vw, 36px)", marginTop: 8 }}>
            {totalCount} thing{totalCount === 1 ? "" : "s"} to be proud of.
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={onUpload}>Add a win</Button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Chip onClick={() => setFilter("ALL")} active={filter === "ALL"}>All</Chip>
        {CATEGORIES.map((c) => {
          const n = achievements.filter((a) => a.category === c.value).length;
          return (
            <Chip
              key={c.value}
              icon={c.icon}
              onClick={() => setFilter(c.value)}
              active={filter === c.value}
            >
              {c.label} · {n}
            </Chip>
          );
        })}
      </div>

      {list.length === 0 ? (
        <Empty icon="trophy" title={achievements.length === 0 ? "No wins yet" : "Nothing in this category"} sub="Add a win to begin your record." action={<Button variant="primary" icon="plus" onClick={onUpload}>Add a win</Button>} />
      ) : (
        <div className="plm-grid-2" style={{ gap: 14 }}>
          {list.map((a) => <AchievementCard key={a.id} ach={a} />)}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ ach }: { ach: Achievement }) {
  const m = categoryMeta(ach.category);
  return (
    <Card padding={0} hover>
      {ach.proofFileUrl && !ach.proofFileUrl.endsWith(".pdf") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ach.proofFileUrl} alt={ach.title} style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", borderRadius: "18px 18px 0 0" }} />
      ) : (
        <ImgPlaceholder
          label={ach.proofFileUrl ? "PDF certificate" : ach.proofUrl ? "external link" : "story"}
          aspect="16 / 10"
          tone={m.tone === "neutral" || m.tone === "teal" ? "cream" : m.tone}
          style={{ borderRadius: "18px 18px 0 0" }}
        />
      )}
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Chip size="sm" tone={m.tone} icon={m.icon}>{m.label}</Chip>
          {ach.isApproved ? <Badge tone="success" dot>Approved</Badge> : <Badge tone="warn" dot>Pending</Badge>}
        </div>
        <div className="plm-display-3" style={{ fontSize: 20 }}>{ach.title}</div>
        {ach.description ? <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>{ach.description}</div> : null}
        <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="calendar" size={12} />{formatDate(ach.createdAt)}
        </div>
      </div>
    </Card>
  );
}

function ChildBadges({ game }: { game: ReturnType<typeof computeGameState> }) {
  const earned = game.badges.filter((b) => b.earned);
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div className="plm-eyebrow">Badges</div>
        <div className="plm-display-2" style={{ fontSize: "clamp(22px, 4.5vw, 36px)", marginTop: 8 }}>{earned.length} of {game.badges.length} unlocked.</div>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8 }}>A few quiet little ceremonies for the things you do.</p>
      </div>
      <div className="plm-grid-4">
        {game.badges.map((b) => (
          <Card key={b.key} padding={24} style={{ textAlign: "center", opacity: b.earned ? 1 : 0.5, position: "relative" }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: b.earned ? "var(--coral-mute)" : "var(--surface-2)",
                color: b.earned ? "var(--coral)" : "var(--ink-faint)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
              }}
            >
              <Icon name={b.earned ? "award" : "lock"} size={28} strokeWidth={1.6} />
            </div>
            <div className="plm-display-3" style={{ fontSize: 18, marginTop: 14 }}>{b.label}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4, lineHeight: 1.4 }}>{b.description}</div>
            {b.progress ? (
              <div style={{ marginTop: 12 }}>
                <ProgressLine value={(b.progress.current / b.progress.target) * 100} tone="coral" />
                <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 6, fontFamily: "var(--font-geist-mono)" }}>{b.progress.current} / {b.progress.target}</div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChildProfile({
  user,
  profile,
  achievements,
  game,
  reload,
  setMessage,
  setError,
}: {
  user: User;
  profile: ChildProfileData | null;
  achievements: Achievement[];
  game: ReturnType<typeof computeGameState>;
  reload: () => Promise<void>;
  setMessage: (v: string | null) => void;
  setError: (v: string | null) => void;
}) {
  if (!profile) {
    return <Empty icon="user" title="No profile yet" sub="Ask your parent to fill in your profile to get started." />;
  }

  async function updatePhoto(photoUrl: string) {
    const res = await fetch(`/api/children/${user.id}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    });
    if (!res.ok) { setError("Couldn't save photo."); return; }
    setMessage("Photo updated.");
    await reload();
  }

  return (
    <div className="plm-cols-asymm">
      <Card padding={0}>
        <ImgPlaceholder label="cover photo" aspect="16 / 6" tone="coral" style={{ borderRadius: "18px 18px 0 0" }} />
        <div style={{ padding: 28, marginTop: -40 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <ProfileAvatar name={user.fullName} photoUrl={profile.photoUrl} size={84} ring />
            <FileUploadButton kind="photo" label={profile.photoUrl ? "Change photo" : "Add a photo"} onUploaded={updatePhoto} onError={setError} />
          </div>
          <div className="plm-display-2" style={{ fontSize: "clamp(22px, 4.5vw, 36px)", marginTop: 14 }}>{user.fullName}</div>
          <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
            {profile.grade ? `${profile.grade} · ` : ""}{profile.school}
          </div>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 14, lineHeight: 1.6 }}>{profile.bio}</p>
          {profile.funFact ? (
            <div style={{ marginTop: 14, padding: 14, background: "var(--amber-mute)", borderRadius: 12, fontSize: 13, color: "#92400E", display: "flex", gap: 10 }}>
              <Icon name="quote" size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <div><strong>Fun fact:</strong> {profile.funFact}</div>
            </div>
          ) : null}
          <div style={{ marginTop: 18 }}>
            <div className="plm-eyebrow" style={{ marginBottom: 8 }}>Skills</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{profile.skills.map((s) => <Chip key={s} tone="coral">{s}</Chip>)}</div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="plm-eyebrow" style={{ marginBottom: 8 }}>Interests</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{profile.interests.map((s) => <Chip key={s} tone="plum">{s}</Chip>)}</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <Card padding={20} style={{ background: profile.isPublic ? "var(--sage-soft)" : "var(--surface-2)", borderColor: profile.isPublic ? "#6EE7B7" : "var(--line)" }}>
          <div className="plm-eyebrow" style={{ color: profile.isPublic ? "#065F46" : "var(--ink-soft)" }}>Visibility</div>
          <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6, color: profile.isPublic ? "#065F46" : "var(--ink)" }}>
            {profile.isPublic ? "Public" : "Private"}
          </div>
          {profile.isPublic ? (
            <>
              <div style={{ fontSize: 12, color: "#065F46", marginTop: 4, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.02em" }}>
                plume.app/p/{user.id.slice(0, 8)}
              </div>
              <Link href={`/p/${user.id}`} target="_blank" style={{ display: "inline-block", marginTop: 12 }}>
                <Button variant="primary" size="sm" iconRight="arrowUpRight">Open public link</Button>
              </Link>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
              Your parent controls this — only your family can see your profile right now.
            </div>
          )}
        </Card>

        <StreakCard achievements={achievements} />

        <LatestBadgeCard game={game} profileUpdatedAt={(profile as ChildProfileData & { updatedAt?: string }).updatedAt} />

        <Card padding={20}>
          <div className="plm-eyebrow">Your level</div>
          <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6 }}>Level {game.level.level} · {game.level.name}</div>
          <div style={{ marginTop: 12 }}>
            <ProgressLine value={game.levelProgress} tone="coral" />
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 8, fontFamily: "var(--font-geist-mono)" }}>
            {game.xp.toLocaleString()} XP · {game.earnedBadgeCount} badges · {game.completion}% complete
          </div>
        </Card>
      </div>
    </div>
  );
}

function StreakCard({ achievements }: { achievements: Achievement[] }) {
  const days = useMemo(() => buildStreak(achievements), [achievements]);
  const activeWeeks = useMemo(() => {
    // Split the 28-day array into 4 weeks of 7 and count weeks with any active day.
    let n = 0;
    for (let w = 0; w < 4; w++) {
      const slice = days.slice(w * 7, w * 7 + 7);
      if (slice.some((d) => d.active)) n++;
    }
    return n;
  }, [days]);

  return (
    <Card padding={20}>
      <div className="plm-eyebrow">My streak</div>
      <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6 }}>
        {activeWeeks} week{activeWeeks === 1 ? "" : "s"} active
      </div>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(28, 1fr)",
          gap: 4,
        }}
        aria-label="Activity over the last 28 days"
      >
        {days.map((d, i) => (
          <span
            key={i}
            title={`${d.label}${d.active ? " — logged a win" : ""}`}
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: 4,
              background: d.color,
              opacity: d.active ? 1 : 0.6,
              transition: "transform 0.18s ease",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 10, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em" }}>
        Last 28 days
      </div>
    </Card>
  );
}

function buildStreak(achievements: Achievement[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDay = new Map<string, Achievement[]>();
  for (const a of achievements) {
    const key = new Date(a.createdAt).toISOString().slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }

  const tones: Record<string, string> = {
    SPORTS: "var(--coral)",
    ACADEMICS: "var(--amber)",
    ARTS: "var(--plum)",
    CODING: "var(--teal)",
    MUSIC: "var(--sage)",
    OTHER: "var(--ink-soft)",
  };

  const out: { label: string; active: boolean; color: string }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayAchievements = byDay.get(key);
    if (dayAchievements && dayAchievements.length > 0) {
      // colour by category of the latest win that day
      const latest = dayAchievements[dayAchievements.length - 1];
      out.push({ label: key, active: true, color: tones[latest.category] ?? "var(--coral)" });
    } else {
      out.push({ label: key, active: false, color: "var(--line)" });
    }
  }
  return out;
}

function LatestBadgeCard({
  game,
  profileUpdatedAt,
}: {
  game: ReturnType<typeof computeGameState>;
  profileUpdatedAt?: string;
}) {
  const earned = game.badges.filter((b) => b.earned);
  if (earned.length === 0) {
    return (
      <Card padding={20}>
        <div className="plm-eyebrow">Latest badge</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface-2)",
              color: "var(--ink-faint)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="lock" size={16} />
          </div>
          <div>
            <div className="plm-display-3" style={{ fontSize: 18 }}>Not yet</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>Log your first win to start earning badges.</div>
          </div>
        </div>
      </Card>
    );
  }

  const latest = earned[earned.length - 1];
  return (
    <Card padding={20}>
      <div className="plm-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Icon name="award" size={12} /> Latest badge
      </div>
      <div className="plm-display-3" style={{ fontSize: 22, marginTop: 6 }}>{latest.label}</div>
      <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4, lineHeight: 1.45 }}>
        {latest.description}{profileUpdatedAt ? ` · ${relativeTime(profileUpdatedAt)}` : ""}
      </div>
    </Card>
  );
}
