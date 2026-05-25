"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordSchema } from "@/lib/validation";
import { Icon } from "@/app/components/icon";
import { Button, Input } from "@/app/components/ui";
import { AuthShell } from "@/app/components/auth-shell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    if (password !== confirm) {
      setFieldError("Passwords don't match.");
      return;
    }
    const parsed = forgotPasswordSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't reset password. Try again.");
      return;
    }
    setSuccess(true);
    setTimeout(() => { router.push("/login"); router.refresh(); }, 1500);
  }

  return (
    <AuthShell
      side={
        <>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="plm-eyebrow" style={{ color: "var(--amber-soft)" }}>Reset · safely</div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="plm-display" style={{ fontSize: 56, lineHeight: 1.05, color: "var(--surface)" }}>
              Set a fresh password.
            </div>
            <p style={{ marginTop: 16, fontSize: 14, color: "rgba(255, 255, 255, 0.78)" }}>
              We&apos;ll update the account and sign you back in. No magic links, no SMS — just a quiet reset.
            </p>
          </div>
        </>
      }
    >
      <div className="plm-eyebrow">Reset password</div>
      <h1 className="plm-display-2" style={{ fontSize: 44, marginTop: 12 }}>Forgot your password?</h1>
      <p style={{ marginTop: 12, color: "var(--ink-soft)", fontSize: 14 }}>
        Enter your account email and pick a new password. We&apos;ll get you back in straight away.
      </p>

      {success ? (
        <div style={{ marginTop: 24, padding: "14px 18px", background: "var(--sage-soft)", color: "#065F46", borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check" size={16} strokeWidth={2.4} />
          Password updated. Redirecting to login…
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: 28, display: "grid", gap: 14 }}>
          <Input
            label="Email" icon="mail" type="email" placeholder="Email on your account"
            value={email} onChange={(e) => setEmail(e.currentTarget.value)} required
          />
          <Input
            label="New password" icon="lock" type={showPw ? "text" : "password"} placeholder="At least 8 characters"
            hint="Use 8 to 100 characters."
            value={password} onChange={(e) => setPassword(e.currentTarget.value)}
            minLength={8} maxLength={100} required
            suffix={
              <button type="button" onClick={() => setShowPw((x) => !x)} style={{ color: "var(--ink-mute)" }} aria-label={showPw ? "Hide password" : "Show password"}>
                <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
              </button>
            }
          />
          <Input
            label="Confirm new password" icon="lock" type={showPw ? "text" : "password"} placeholder="Type it again"
            value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)}
            minLength={8} maxLength={100} required error={fieldError ?? undefined}
          />

          {error ? (
            <div style={{ background: "var(--coral-mute)", color: "var(--coral-deep)", padding: "10px 14px", borderRadius: 12, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="info" size={16} />{error}
            </div>
          ) : null}

          <Button type="submit" variant="primary" size="lg" full disabled={loading} iconRight={loading ? undefined : "arrowRight"}>
            {loading ? "Updating…" : "Update password"}
          </Button>

          <div style={{ marginTop: 8, fontSize: 13, textAlign: "center", color: "var(--ink-soft)" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "var(--coral-deep)", textDecoration: "underline" }}>Back to login</Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
