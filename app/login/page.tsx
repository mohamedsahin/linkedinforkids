"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/validation";
import { Icon } from "@/app/components/icon";
import { Button, Input } from "@/app/components/ui";
import { ProfileAvatar } from "@/app/components/profile-avatar";
import { AuthShell } from "@/app/components/auth-shell";

type LoginFieldErrors = Partial<Record<"email" | "password", string>>;
type LoginRole = "parent" | "child" | "admin";

const REMEMBER_KEY = "plm.rememberEmail";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REMEMBER_KEY);
      if (stored) {
        setEmail(stored);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const payload = { email, password, role: role.toUpperCase() as "PARENT" | "CHILD" | "ADMIN" };

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      const next: LoginFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in next)) {
          next[field as keyof LoginFieldErrors] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: LoginFieldErrors };
      if (data.fieldErrors) setFieldErrors(data.fieldErrors);
      setError(data.error ?? "Login failed.");
      return;
    }
    try {
      if (remember) window.localStorage.setItem(REMEMBER_KEY, parsed.data.email);
      else window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      side={
        <>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="plm-eyebrow" style={{ color: "var(--amber-soft)" }}>Featured family</div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="plm-display" style={{ fontSize: 56, lineHeight: 1.05, color: "var(--surface)" }}>
              &ldquo;She finally has somewhere to put the things she&apos;s proud of.&rdquo;
            </div>
            <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 12 }}>
              <ProfileAvatar name="Noor Khalifa" size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--surface)" }}>Noor Khalifa</div>
                <div style={{ fontSize: 12, opacity: 0.6, color: "var(--surface)" }}>Parent of Amara &amp; Yusuf · Dubai</div>
              </div>
            </div>
          </div>
        </>
      }
    >
      <div className="plm-eyebrow">Welcome back</div>
      <h1 className="plm-display-2" style={{ fontSize: 44, marginTop: 12 }}>Log in</h1>
      <p style={{ marginTop: 12, color: "var(--ink-soft)", fontSize: 14 }}>
        One door for everyone — parents, kids, and admins. We&apos;ll route you to the right place.
      </p>

      {/* role tabs */}
      <div
        role="tablist"
        aria-label="Account type"
        style={{
          marginTop: 28,
          display: "flex",
          padding: 4,
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 999,
        }}
      >
        {([
          { id: "parent", label: "Parent" },
          { id: "child",  label: "Child" },
          { id: "admin",  label: "Admin" },
        ] as const).map((t) => {
          const active = role === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setRole(t.id); setError(null); }}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--surface)" : "var(--ink-soft)",
                transition: "background 0.16s ease, color 0.16s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 20, display: "grid", gap: 14 }}>
        <Input
          label="Email"
          icon="mail"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={fieldErrors.email}
          required
        />
        <Input
          label="Password"
          icon="lock"
          type={showPw ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          error={fieldErrors.password}
          minLength={8}
          maxLength={100}
          required
          suffix={
            <button type="button" onClick={() => setShowPw((x) => !x)} style={{ color: "var(--ink-mute)" }} aria-label={showPw ? "Hide password" : "Show password"}>
              <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
            </button>
          }
          hint={fieldErrors.password ? undefined : "Use 8 to 100 characters."}
        />

        {error ? (
          <div style={{ background: "var(--coral-mute)", color: "var(--coral-deep)", padding: "10px 14px", borderRadius: 12, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="info" size={16} />{error}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "var(--ink-soft)" }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.currentTarget.checked)}
            />
            Remember me
          </label>
          <Link href="/forgot-password" style={{ color: "var(--coral-deep)", textDecoration: "underline" }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" full disabled={loading} iconRight={loading ? undefined : "arrowRight"}>
          {loading ? "Signing in…" : "Continue"}
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0", color: "var(--ink-mute)", fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          New to Plume?
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>
        <Link href="/signup"><Button type="button" variant="outline" size="lg" full>Create a family account</Button></Link>
      </form>
    </AuthShell>
  );
}


