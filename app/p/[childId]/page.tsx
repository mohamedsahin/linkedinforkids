import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { computeGameState } from "@/lib/gamification";
import { Icon } from "@/app/components/icon";
import { Logo, Chip, ImgPlaceholder, ProgressLine } from "@/app/components/ui";
import { categoryMeta } from "@/lib/categories";
import { ProfileAvatar } from "@/app/components/profile-avatar";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  type PublicProfileResult = {
    role: UserRole;
    fullName: string;
    isSuspended: boolean;
    childProfile: {
      age: number;
      grade: string | null;
      school: string;
      bio: string;
      funFact: string | null;
      skills: string[];
      interests: string[];
      location: string | null;
      photoUrl: string | null;
      isPublic: boolean;
    } | null;
    achievements: Array<{
      id: string;
      title: string;
      description: string | null;
      category: string;
      proofUrl: string | null;
      proofFileUrl: string | null;
      createdAt: Date;
      coSigns: Array<{ signerName: string | null; signerTitle: string | null; signedAt: Date | null }>;
    }>;
  } | null;

  const child = (await prisma.user.findUnique({
    where: { id: childId },
    include: {
      childProfile: true,
      achievements: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: {
          coSigns: {
            where: { signedAt: { not: null } },
            orderBy: { signedAt: "desc" },
            select: { signerName: true, signerTitle: true, signedAt: true },
          },
        },
      },
    },
  })) as unknown as PublicProfileResult;

  if (
    !child ||
    child.role !== UserRole.CHILD ||
    child.isSuspended ||
    !child.childProfile ||
    !child.childProfile.isPublic
  ) {
    notFound();
  }

  const profile = child.childProfile;
  const achievements = child.achievements;
  const game = computeGameState(
    profile,
    achievements.map((a) => ({ category: a.category, isApproved: true }))
  );
  const earnedBadges = game.badges.filter((b) => b.earned);
  const cats = Array.from(new Set(achievements.map((a) => a.category)));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Slim public nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <Link href="/"><Logo size={20} /></Link>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", display: "flex", gap: 10, alignItems: "center" }}>
          <Icon name="shieldCheck" size={14} style={{ color: "var(--sage)" }} />
          <span>Public, read-only portfolio · no messaging, no comments</span>
        </div>
        <Link href="/signup">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 500, borderRadius: 999, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--ink)" }}>
            Create your own <Icon name="arrowRight" size={14} />
          </span>
        </Link>
      </div>

      {/* Hero */}
      <section style={{ padding: "64px 40px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <ProfileAvatar name={child.fullName} photoUrl={profile.photoUrl} size={68} />
              <div>
                <div className="plm-eyebrow">{profile.school}</div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                  {profile.grade ? `${profile.grade} · ` : ""}
                  {profile.location ? profile.location : `Age ${profile.age}`}
                </div>
              </div>
            </div>
            <h1 className="plm-display" style={{ fontSize: "clamp(48px, 8vw, 92px)", lineHeight: 1.0, letterSpacing: "-0.025em" }}>
              {child.fullName}
            </h1>
            <p style={{ fontSize: 19, color: "var(--ink-soft)", marginTop: 24, lineHeight: 1.5, maxWidth: 540 }}>{profile.bio}</p>
            {profile.funFact ? (
              <div style={{ marginTop: 24, padding: 18, background: "var(--surface)", borderLeft: "3px solid var(--coral)", borderRadius: "0 14px 14px 0", fontStyle: "italic", color: "var(--ink-2)", fontSize: 15 }}>
                &ldquo;{profile.funFact}&rdquo;
              </div>
            ) : null}
            <div style={{ marginTop: 28, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {profile.skills.map((s) => <Chip key={s} size="lg" tone="coral">{s}</Chip>)}
            </div>
          </div>

          <div style={{ position: "relative", aspectRatio: "4 / 5" }}>
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={child.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
              />
            ) : (
              <ImgPlaceholder label="portrait" aspect="4 / 5" tone="coral" style={{ height: "100%" }} />
            )}
            <div
              style={{
                position: "absolute", bottom: 16, left: 16, right: 16,
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(10px)",
                color: "var(--surface)",
                padding: 16, borderRadius: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
                <Icon name="shieldCheck" size={12} style={{ color: "var(--amber-soft)" }} /> Level {game.level.level} · {game.level.name}
              </div>
              <div className="plm-display-3" style={{ fontSize: 20, marginTop: 6 }}>
                {game.xp.toLocaleString()} XP · {earnedBadges.length} badge{earnedBadges.length === 1 ? "" : "s"}
              </div>
              <div style={{ marginTop: 10 }}>
                <ProgressLine value={game.levelProgress} tone="coral" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          <Stat n={achievements.length} label="Approved wins" />
          <Stat n={cats.length}         label="Categories" />
          <Stat n={game.level.level}    label="Level reached" sub={game.level.name} />
          <Stat n={earnedBadges.length} label="Badges earned" />
        </div>
      </section>

      {/* Badges */}
      {earnedBadges.length > 0 ? (
        <section style={{ padding: "48px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div className="plm-eyebrow">Badges</div>
          <h2 className="plm-display-2" style={{ fontSize: 36, marginTop: 12, marginBottom: 24 }}>
            {earnedBadges.length} earned.
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {earnedBadges.map((b) => (
              <Chip key={b.key} size="lg" tone="amber">{b.label}</Chip>
            ))}
          </div>
        </section>
      ) : null}

      {/* Interests */}
      {profile.interests.length > 0 ? (
        <section style={{ padding: "0 40px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <div className="plm-eyebrow">Interests</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {profile.interests.map((i) => <Chip key={i} size="md" tone="plum">{i}</Chip>)}
          </div>
        </section>
      ) : null}

      {/* Timeline */}
      <section style={{ padding: "32px 40px 64px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="plm-eyebrow">Selected work</div>
            <h2 className="plm-display-2" style={{ fontSize: 48, marginTop: 12 }}>The record so far.</h2>
          </div>
        </div>

        {achievements.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", border: "1px dashed var(--line-strong)", borderRadius: 16, background: "var(--surface-2)", color: "var(--ink-soft)" }}>
            No achievements published yet. Stay tuned.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {achievements.map((a) => {
              const m = categoryMeta(a.category);
              const dateString = a.createdAt instanceof Date ? a.createdAt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
              return (
                <article key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
                  {a.proofFileUrl && !a.proofFileUrl.endsWith(".pdf") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.proofFileUrl} alt={a.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                  ) : (
                    <ImgPlaceholder
                      label={a.proofFileUrl ? "certificate" : a.proofUrl ? "external link" : "story"}
                      aspect="16 / 9"
                      tone={m.tone === "neutral" || m.tone === "teal" ? "cream" : m.tone}
                    />
                  )}
                  <div style={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Chip size="sm" tone={m.tone} icon={m.icon}>{m.label}</Chip>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>{dateString}</span>
                    </div>
                    <h3 className="plm-display-3" style={{ fontSize: 22, marginTop: 12 }}>{a.title}</h3>
                    {a.description ? <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.55 }}>{a.description}</p> : null}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-mute)" }}>
                        <Icon name="shieldCheck" size={14} style={{ color: "var(--sage)" }} />
                        {a.coSigns.length > 0 && a.coSigns[0].signerName
                          ? `Verified by ${a.coSigns[0].signerName}${a.coSigns[0].signerTitle ? ` · ${a.coSigns[0].signerTitle}` : ""}`
                          : "Verified by parent"}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {a.proofFileUrl ? (
                          a.proofFileUrl.endsWith(".pdf") ? (
                            <a href={a.proofFileUrl} target="_blank" rel="noreferrer noopener">
                              <Chip size="sm" tone="ghost" icon="file">Certificate</Chip>
                            </a>
                          ) : (
                            <Chip size="sm" tone="ghost" icon="image">Photo</Chip>
                          )
                        ) : null}
                        {a.proofUrl ? (
                          <a href={a.proofUrl} target="_blank" rel="noreferrer noopener">
                            <Chip size="sm" tone="ghost" icon="link">External link</Chip>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px 40px", background: "var(--ink)", color: "var(--surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Logo size={20} color="var(--surface)" />
            <div style={{ fontSize: 13, opacity: 0.5, marginTop: 12 }}>
              This profile is published by {child.fullName}&apos;s parents and read-only.<br />
              No messages, no comments, no DMs.
            </div>
          </div>
          <Link href="/signup">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: "var(--coral)", color: "var(--surface)", borderRadius: 999, fontWeight: 500, fontSize: 14 }}>
              Build a portfolio like this <Icon name="arrowRight" size={16} />
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, label, sub }: { n: number; label: string; sub?: string }) {
  return (
    <div>
      <div className="plm-display" style={{ fontSize: 52, color: "var(--ink)", letterSpacing: "-0.025em" }}>{n}</div>
      <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>{label}</div>
      {sub ? <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{sub}</div> : null}
    </div>
  );
}
