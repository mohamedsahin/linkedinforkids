"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupSchema } from "@/lib/validation";
import { Icon } from "@/app/components/icon";
import { Button, Input } from "@/app/components/ui";
import { AuthShell } from "@/app/components/auth-shell";

type SignupFieldErrors = Partial<Record<"fullName" | "email" | "password", string>>;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ fullName: "", email: "", password: "", agreeTos: false, hasKids: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});

  function clearError(field: keyof SignupFieldErrors) {
    setFieldErrors((p) => ({ ...p, [field]: undefined }));
    setError(null);
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      if (!data.fullName || data.fullName.length < 2) {
        setFieldErrors({ fullName: "Please enter your full name." });
        return;
      }
      if (!data.email) {
        setFieldErrors({ email: "Email is required." });
        return;
      }
      setFieldErrors({});
      setStep(2);
      return;
    }

    if (step === 2) {
      const parsed = signupSchema.safeParse(data);
      if (!parsed.success) {
        const next: SignupFieldErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && !(field in next)) {
            next[field as keyof SignupFieldErrors] = issue.message;
          }
        }
        setFieldErrors(next);
        return;
      }
      if (!data.agreeTos) {
        setError("Please accept the family agreement to continue.");
        return;
      }
      setFieldErrors({});
      setLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: data.fullName, email: data.email, password: data.password }),
      });
      setLoading(false);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: SignupFieldErrors };
        if (body.fieldErrors) setFieldErrors(body.fieldErrors);
        setError(body.error ?? "Sign up failed.");
        return;
      }
      try {
        if (data.hasKids) {
          window.localStorage.setItem("plm.signup.expectedChildren", data.hasKids);
        }
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <AuthShell
      side={
        <>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="plm-eyebrow" style={{ color: "var(--amber-soft)" }}>What you get</div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "grid", gap: 24 }}>
              {[
                { n: "01", t: "A portfolio in 4 minutes",       b: "Add your child, fill three fields, you're done." },
                { n: "02", t: "Always under your name",          b: "Children never sign up alone. The account is yours." },
                { n: "03", t: "Public when you decide",          b: "Off by default. Toggle on for a clean share-link." },
              ].map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start", paddingBottom: 24, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div className="plm-display" style={{ fontSize: 28, opacity: 0.5, letterSpacing: "-0.02em", minWidth: 36, color: "var(--surface)" }}>{s.n}</div>
                  <div>
                    <div className="plm-display-3" style={{ fontSize: 20, color: "var(--surface)" }}>{s.t}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4, color: "var(--surface)" }}>{s.b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      }
    >
      <div className="plm-eyebrow">Create a family account</div>
      <h1 className="plm-display-2" style={{ fontSize: 44, marginTop: 12 }}>Get started.</h1>
      <p style={{ marginTop: 12, color: "var(--ink-soft)", fontSize: 14 }}>
        You&apos;ll set up the family first. You can add your children once you&apos;re in.
      </p>

      <div style={{ marginTop: 28, display: "flex", gap: 8 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 999, background: step >= s ? "var(--coral)" : "var(--line)" }} />
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--ink-mute)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Step {step} of 2 · {step === 1 ? "About you" : "Secure your account"}
      </div>

      <form onSubmit={next} style={{ marginTop: 24, display: "grid", gap: 14 }}>
        {step === 1 ? (
          <>
            <Input
              label="Your full name"
              icon="user"
              placeholder="Noor Khalifa"
              value={data.fullName}
              onChange={(e) => { setData({ ...data, fullName: e.currentTarget.value }); clearError("fullName"); }}
              error={fieldErrors.fullName}
              minLength={2}
              maxLength={80}
              required
            />
            <Input
              label="Email address"
              icon="mail"
              type="email"
              placeholder="you@example.com"
              hint="Used for all family notifications and account recovery."
              value={data.email}
              onChange={(e) => { setData({ ...data, email: e.currentTarget.value }); clearError("email"); }}
              error={fieldErrors.email}
              required
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>How many children will you add? (Optional)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4+"].map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setData({ ...data, hasKids: k })}
                    style={{
                      padding: "12px 0", borderRadius: 12,
                      border: `1px solid ${data.hasKids === k ? "var(--ink)" : "var(--line)"}`,
                      background: data.hasKids === k ? "var(--ink)" : "var(--paper)",
                      color: data.hasKids === k ? "var(--surface)" : "var(--ink)",
                      fontWeight: 500, fontSize: 14,
                    }}
                  >{k}</button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <Input
              label="Password"
              icon="lock"
              type={showPw ? "text" : "password"}
              placeholder="At least 8 characters"
              hint={fieldErrors.password ? undefined : "Use a mix of letters, numbers, and symbols."}
              value={data.password}
              onChange={(e) => { setData({ ...data, password: e.currentTarget.value }); clearError("password"); }}
              error={fieldErrors.password}
              minLength={8}
              maxLength={100}
              required
              suffix={
                <button type="button" onClick={() => setShowPw((x) => !x)} style={{ color: "var(--ink-mute)" }} aria-label={showPw ? "Hide password" : "Show password"}>
                  <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
                </button>
              }
            />
            <div style={{ background: "var(--surface-2)", padding: 16, borderRadius: 12, border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="shield" size={14} style={{ color: "var(--sage)" }} /> The Plume family agreement
              </div>
              <ul style={{ fontSize: 12, color: "var(--ink-soft)", padding: 0, listStyle: "none", margin: 0, display: "grid", gap: 6 }}>
                <li>• Children never sign up alone. You are always the account holder.</li>
                <li>• You can read, edit, delete, or hide any content your child uploads.</li>
                <li>• Profiles are private until you turn public access on.</li>
                <li>• We never sell or share data. Ever.</li>
              </ul>
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={data.agreeTos}
                  onChange={(e) => setData({ ...data, agreeTos: e.currentTarget.checked })}
                  style={{ marginTop: 3 }}
                />
                I understand — and I agree to the{" "}
                <a style={{ color: "var(--coral-deep)", textDecoration: "underline" }}>Terms</a> and{" "}
                <a style={{ color: "var(--coral-deep)", textDecoration: "underline" }}>Privacy Policy</a>.
              </label>
            </div>
          </>
        )}

        {error ? (
          <div style={{ background: "var(--coral-mute)", color: "var(--coral-deep)", padding: "10px 14px", borderRadius: 12, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="info" size={16} />{error}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {step > 1 ? <Button type="button" variant="outline" size="lg" onClick={() => setStep(step - 1)}>Back</Button> : null}
          <Button type="submit" variant="primary" size="lg" full iconRight="arrowRight" disabled={loading}>
            {step === 2 ? (loading ? "Creating…" : "Open my dashboard") : "Continue"}
          </Button>
        </div>

        {step === 1 ? (
          <div style={{ marginTop: 8, fontSize: 13, textAlign: "center", color: "var(--ink-soft)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--coral-deep)", textDecoration: "underline" }}>Log in</Link>
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}
