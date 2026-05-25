import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { Icon, IconName } from "@/app/components/icon";
import { Button, Logo, Chip, Badge, ProgressLine, ImgPlaceholder, Count } from "@/app/components/ui";
import { ProfileAvatar } from "@/app/components/profile-avatar";

export default async function Home() {
  const user = await getCurrentSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div>
      {/* Top nav */}
      <nav
        className="plm-anim plm-anim-fade-down"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
          padding: "16px clamp(16px, 4vw, 40px)", borderBottom: "1px solid var(--line)",
          background: "rgba(248, 250, 252, 0.85)", backdropFilter: "blur(8px)",
          position: "sticky", top: 0, zIndex: 10,
        }}
      >
        <Logo size={22} />
        <div className="plm-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14 }}>
          <a href="#how"      style={{ color: "var(--ink-soft)" }}>How it works</a>
          <a href="#safety"   style={{ color: "var(--ink-soft)" }}>Safety</a>
          <a href="#pricing"  style={{ color: "var(--ink-soft)" }}>Pricing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/login" className="plm-hide-mobile"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link href="/signup"><Button variant="primary" size="sm" iconRight="arrowRight">Start free</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "clamp(40px, 7vw, 72px) clamp(16px, 4vw, 40px) clamp(40px, 5vw, 56px)", maxWidth: 1320, margin: "0 auto" }}>
        <div className="plm-cols-split-wide">
          <div>
            <div
              className="plm-anim plm-anim-fade"
              style={{ animationDelay: "60ms", display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, fontSize: 12 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sage)" }} />
              <span className="plm-mute">New · Parent-approved portfolios for K-12</span>
            </div>
            <h1 className="plm-display" style={{ fontSize: "clamp(56px, 7vw, 96px)", marginTop: 24, color: "var(--ink)" }}>
              <span className="plm-anim plm-anim-rise" style={{ display: "inline-block", animationDelay: "100ms" }}>
                A portfolio for
              </span>
              <br />
              <span
                className="plm-anim plm-anim-rise"
                style={{ display: "inline-block", animationDelay: "220ms", fontStyle: "italic", color: "var(--coral)" }}
              >
                young talent
              </span>
              <span className="plm-anim plm-anim-fade" style={{ animationDelay: "380ms" }}>.</span>
            </h1>
            <p
              className="plm-anim plm-anim-rise"
              style={{ animationDelay: "300ms", fontSize: 19, color: "var(--ink-soft)", maxWidth: 520, marginTop: 24, lineHeight: 1.5 }}
            >
              {BRAND.name} is where children build a real record of what they&apos;ve done — sport, art, code, music, school — verified by the adults who actually saw them do it.
            </p>
            <div className="plm-anim plm-anim-rise" style={{ animationDelay: "400ms", display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <Link href="/signup"><Button variant="coral" size="lg" iconRight="arrowRight">Create a family account</Button></Link>
              <a href="#how"><Button variant="outline" size="lg">See how it works</Button></a>
            </div>
            <div className="plm-anim plm-anim-fade" style={{ animationDelay: "500ms", display: "flex", alignItems: "center", gap: 16, marginTop: 36 }}>
              <div style={{ display: "flex" }}>
                {["#BFDBFE", "#FDE68A", "#A7F3D0", "#E9D5FF"].map((c, i) => (
                  <div
                    key={i}
                    className="plm-anim plm-anim-pop"
                    style={{ animationDelay: `${540 + i * 50}ms`, marginLeft: i ? -10 : 0, width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--bg)", background: c }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>1,248 families</strong> already proud · founded in Dubai
              </div>
            </div>
          </div>

          <div className="plm-hide-mobile">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="reveal" style={{ padding: "clamp(24px, 4vw, 32px) clamp(16px, 4vw, 40px)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div className="plm-eyebrow">Trusted across the region</div>
          <div style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
            {["GEMS Education", "Repton Family", "Dubai Modern", "Kings'", "Jumeirah College", "JESS"].map((name, i) => (
              <div
                key={name}
                className="reveal"
                style={{ transitionDelay: `${i * 70}ms`, fontFamily: "var(--font-instrument-serif)", fontSize: 18, color: "var(--ink-soft)", letterSpacing: "-0.01em" }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section style={{ padding: "clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px)", maxWidth: 1320, margin: "0 auto" }}>
        <div className="plm-grid-4" style={{ gap: 24 }}>
          {[
            { val: 1248, suffix: "+", label: "Active families",     sub: "+38 this week" },
            { val: 5841, suffix: "",  label: "Achievements logged", sub: "187 approved this week" },
            { val: 100,  suffix: "%", label: "Parent-controlled",   sub: "Zero open inboxes" },
            { val: 0,    suffix: "",  label: "DMs, ever",            sub: "By design, not by setting" },
          ].map((m, i) => (
            <div
              key={m.label}
              className="reveal"
              style={{ transitionDelay: `${i * 100}ms`, padding: "32px 4px", borderTop: "1px solid var(--line)" }}
            >
              <div className="plm-display" style={{ fontSize: 60, letterSpacing: "-0.025em" }}>
                <Count to={m.val} />{m.suffix}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginTop: 8 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="plm-section" style={{ background: "var(--surface-2)", borderTop: "1px solid var(--line)" }}>
        <div className="plm-wrap">
          <div className="reveal plm-cols-split-wide" style={{ marginBottom: 64 }}>
            <div>
              <div className="plm-eyebrow">How it works</div>
              <h2 className="plm-display-2" style={{ fontSize: "clamp(34px, 5vw, 56px)", marginTop: 16 }}>
                Parent-first,<br />by design.
              </h2>
            </div>
            <p style={{ fontSize: 18, color: "var(--ink-soft)", lineHeight: 1.55, alignSelf: "center" }}>
              {BRAND.name} is built around one simple rule: the adult in the room runs the room. There is no public discovery feed, no random connections, no inbox to police. Just a tidy record of real accomplishments, kept on the family&apos;s terms.
            </p>
          </div>
          <div className="plm-grid-4" style={{ gap: 0, borderTop: "1px solid var(--line-strong)" }}>
            {[
              { n: "01", title: "A parent opens the family account", body: "Children never sign up alone. You set the email, the password, and exactly which surfaces are visible." },
              { n: "02", title: "Your child builds their portfolio", body: "Skills, interests, school, and a short bio. They add wins as they happen — a match, a piece, a grade." },
              { n: "03", title: "Every upload is moderated",         body: "Kids submit, you approve. The result is a record you actually trust — and one a school or coach will too." },
              { n: "04", title: "Share it on your terms",             body: "Keep it private inside the family. Or publish a clean, read-only link — no comments, no DMs, no feed." },
            ].map((s, i) => (
              <div
                key={s.n}
                className="reveal"
                style={{ transitionDelay: `${i * 120}ms`, padding: "32px 28px 28px 0", borderRight: i < 3 ? "1px solid var(--line)" : "none", paddingLeft: i ? 28 : 0 }}
              >
                <div className="plm-eyebrow" style={{ color: "var(--coral)" }}>{s.n}</div>
                <div className="plm-display-3" style={{ fontSize: 22, marginTop: 18 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="plm-section">
        <div className="plm-wrap">
          <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 24 }}>
            <div>
              <div className="plm-eyebrow">Safety</div>
              <h2 className="plm-display-2" style={{ fontSize: "clamp(32px, 5vw, 52px)", marginTop: 16 }}>
                Built like a <span style={{ fontStyle: "italic", color: "var(--coral)" }}>library</span>,<br />not a feed.
              </h2>
            </div>
            <div style={{ maxWidth: 360, color: "var(--ink-soft)", fontSize: 15 }}>
              Most kid-safe products are adult products with a moderation team bolted on. {BRAND.name} started with a different question: what would a children&apos;s product look like if it never needed one?
            </div>
          </div>

          <div className="plm-grid-3" style={{ gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
            {([
              { icon: "shield",      title: "No discovery feed",            body: "Profiles are private by default. There is no algorithm pushing your child to strangers." },
              { icon: "lock",        title: "No messaging, ever",            body: "Plume has no DMs, no comments, no replies. A profile is something to read, not somewhere to chat." },
              { icon: "eye",         title: "Parent-controlled visibility",  body: "Toggle public access on or off in one click. Disabling instantly de-indexes the link." },
              { icon: "checkCircle", title: "Moderated uploads",             body: "Children submit; a parent or admin approves. Nothing goes live until you say so." },
              { icon: "users",       title: "School & coach co-sign",        body: "Teachers can attach a one-line verification to a win. No accounts, no inbox, just a signed link." },
              { icon: "trash",       title: "Right to be forgotten",         body: "Delete a profile and all uploads are purged within 24 hours. No shadow copies, no archive." },
            ] as Array<{ icon: IconName; title: string; body: string }>).map((it, i) => (
              <div
                key={it.title}
                className="reveal"
                style={{ transitionDelay: `${(i % 3) * 80 + Math.floor(i / 3) * 60}ms`, background: "var(--surface)", padding: "32px 28px" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--coral-mute)", color: "var(--coral)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={it.icon} size={20} strokeWidth={1.8} />
                </div>
                <div className="plm-display-3" style={{ fontSize: 20, marginTop: 18 }}>{it.title}</div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.55 }}>{it.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="plm-section" style={{ background: "var(--surface-2)" }}>
        <div className="reveal reveal-scale" style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
          <Icon name="quote" size={32} style={{ color: "var(--coral)" }} />
          <h2 className="plm-display-2" style={{ fontSize: "clamp(24px, 4vw, 40px)", marginTop: 24, lineHeight: 1.25 }}>
            &ldquo;For the first time, my daughter has somewhere to put the things she&apos;s proud of that isn&apos;t a phone full of half-screenshots. And I get to be the one who decides who sees them.&rdquo;
          </h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 32 }}>
            <ProfileAvatar name="Noor Khalifa" size={44} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 500 }}>Noor Khalifa</div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>Parent of two · Dubai</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="plm-section">
        <div className="plm-wrap">
          <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="plm-eyebrow">Pricing</div>
            <h2 className="plm-display-2" style={{ fontSize: "clamp(32px, 5vw, 52px)", marginTop: 16 }}>
              One family. One small fee.<br />No ads, ever.
            </h2>
          </div>
          <div className="plm-grid-3" style={{ gap: 20 }}>
            {[
              { name: "Family",  price: "Free",     sub: "1 parent, up to 2 children. No credit card.",       features: ["All core features", "Public profile link", "10 active achievements", "Standard moderation"],                                              primary: false, cta: "Start free" },
              { name: "Family+", price: "AED 29",   per: "/ month", sub: "Up to 6 children. The plan most families pick.", features: ["Unlimited achievements", "PDF year-in-review export", "Teacher co-sign verifications", "Priority moderation (<2h)", "Custom portfolio URL"], primary: true,  cta: "Start free trial" },
              { name: "School",  price: "Custom",   sub: "For schools and academies issuing portfolios at scale.", features: ["Bulk roster onboarding", "School-branded portfolio", "Single sign-on (SAML)", "Account manager", "Data residency options"],                       primary: false, cta: "Talk to us" },
            ].map((p, i) => (
              <div
                key={p.name}
                className="reveal reveal-scale plm-card-hover"
                style={{
                  transitionDelay: `${i * 120}ms`,
                  padding: 32,
                  borderRadius: 22,
                  background: p.primary ? "var(--ink)" : "var(--surface)",
                  color: p.primary ? "var(--surface)" : "var(--ink)",
                  border: p.primary ? "1px solid var(--ink)" : "1px solid var(--line)",
                  position: "relative",
                }}
              >
                {p.primary ? (
                  <span style={{ position: "absolute", top: -12, left: 32, background: "var(--coral)", color: "var(--surface)", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Most popular
                  </span>
                ) : null}
                <div className="plm-display-3" style={{ fontSize: 24 }}>{p.name}</div>
                <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="plm-display" style={{ fontSize: 52 }}>{p.price}</span>
                  {p.per ? <span style={{ fontSize: 14, opacity: 0.7 }}>{p.per}</span> : null}
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4, minHeight: 36 }}>{p.sub}</div>
                <Link href="/signup">
                  <Button variant={p.primary ? "coral" : "primary"} size="md" full style={{ marginTop: 24 }}>{p.cta}</Button>
                </Link>
                <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "grid", gap: 10, borderTop: p.primary ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid var(--line)", paddingTop: 20 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                      <Icon name="check" size={14} strokeWidth={2.2} style={{ color: p.primary ? "var(--amber-soft)" : "var(--coral)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="plm-section">
        <div className="reveal reveal-scale plm-wrap" style={{ background: "var(--ink)", color: "var(--surface)", borderRadius: "clamp(20px, 3vw, 32px)", padding: "clamp(48px, 7vw, 80px) clamp(28px, 5vw, 64px)", position: "relative", overflow: "hidden" }}>
          <div className="plm-orb-pulse" style={{ position: "absolute", inset: "auto -10% -60% auto", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, var(--coral) 0%, transparent 70%)", opacity: 0.4 }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
            <h2 className="plm-display" style={{ fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 1.02 }}>
              Their first portfolio.<br />
              <span style={{ fontStyle: "italic", color: "var(--amber-soft)" }}>The one that lasts.</span>
            </h2>
            <p style={{ marginTop: 24, fontSize: 18, opacity: 0.8, maxWidth: 480 }}>
              {BRAND.name} is free to start. Children never sign up alone. You&apos;re always in control. Build the record you wish you had.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 40, flexWrap: "wrap" }}>
              <Link href="/signup"><Button variant="coral" size="lg" iconRight="arrowRight">Create your family account</Button></Link>
              <Link href="/login"><Button variant="on-dark" size="lg">I already have an account</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "clamp(32px, 5vw, 48px) clamp(16px, 4vw, 40px)", borderTop: "1px solid var(--line)" }}>
        <div className="plm-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Logo size={18} />
          <div style={{ display: "flex", gap: 28, fontSize: 13, color: "var(--ink-soft)" }}>
            <a>Privacy</a><a>Terms</a><a>COPPA</a><a>GDPR-K</a><a>Press</a><a>Careers</a>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>© 2026 {BRAND.name} · Made in Dubai</div>
        </div>
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1.05" }}>
      {/* main portfolio card */}
      <div
        className="plm-anim plm-anim-scale"
        style={{
          animationDelay: "120ms",
          position: "absolute", inset: "8% 14% 6% 8%",
          background: "var(--surface)", borderRadius: 24, padding: 24,
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-lg)",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ProfileAvatar name="Amara Khalifa" size={48} />
          <div>
            <div className="plm-display-3" style={{ fontSize: 20 }}>Amara Khalifa</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>Age 11 · Grade 6 · Dubai</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Badge tone="success" dot>Public</Badge>
          </div>
        </div>
        <ImgPlaceholder label="watercolor — hoopoe" aspect="16 / 10" tone="coral" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: "trophy",  tone: "coral", label: "Birdwatcher 2026" },
            { icon: "palette", tone: "plum",  label: "Art exhibit" },
            { icon: "book",    tone: "amber", label: "Story published" },
            { icon: "code",    tone: "teal",  label: "Scratch app" },
          ].map((c, i) => (
            <span
              key={c.label}
              className="plm-anim plm-anim-pop"
              style={{ animationDelay: `${440 + i * 60}ms`, display: "inline-block" }}
            >
              <Chip icon={c.icon as IconName} tone={c.tone as "coral" | "plum" | "amber" | "teal"} size="sm">{c.label}</Chip>
            </span>
          ))}
        </div>
      </div>

      {/* floating verified card */}
      <div
        className="plm-anim plm-anim-slide-r"
        style={{
          animationDelay: "320ms",
          position: "absolute", top: "4%", right: "-2%", width: 220,
          background: "var(--paper)", borderRadius: 16, padding: 14,
          border: "1px solid var(--line)", boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="plm-float">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--sage-soft)", color: "var(--sage)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="shieldCheck" size={16} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Verified by</div>
          </div>
          <div className="plm-display-3" style={{ fontSize: 16, marginTop: 6 }}>Mrs. Pillai</div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>Art teacher · 12 Feb 2026</div>
        </div>
      </div>

      {/* floating level card */}
      <div
        className="plm-anim plm-anim-slide-l"
        style={{
          animationDelay: "440ms",
          position: "absolute", bottom: "-2%", left: "-1%", width: 200,
          background: "var(--ink)", color: "var(--surface)",
          borderRadius: 16, padding: 16,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="plm-float-slow">
          <div className="plm-eyebrow" style={{ color: "var(--amber-soft)" }}>Level 7</div>
          <div className="plm-display-3" style={{ fontSize: 22, marginTop: 2 }}>Explorer</div>
          <ProgressLine value={62} tone="coral" />
          <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>340 XP to Pioneer</div>
        </div>
      </div>
    </div>
  );
}

