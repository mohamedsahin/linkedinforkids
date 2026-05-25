"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/app/components/icons";
import { Button, Card, Chip, Input, Logo, Textarea, categoryMeta } from "@/app/components/ui";

type LookupResponse = {
  cosign: { id: string; signerEmail: string; signedAt: string | null; expiresAt: string; note: string | null };
  achievement: {
    id: string; title: string; description: string | null; category: string;
    createdAt: string;
    child: { fullName: string; school: string | null; grade: string | null };
  } | null;
};

export default function CosignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ready"; data: LookupResponse } | { kind: "error"; message: string } | { kind: "done"; signerName: string }>({ kind: "loading" });
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/cosign/${token}`, { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState({ kind: "error", message: body.error ?? "This link can't be used." });
        return;
      }
      const data = (await res.json()) as LookupResponse;
      if (data.cosign.signedAt) {
        setState({ kind: "error", message: "This link has already been used." });
        return;
      }
      setState({ kind: "ready", data });
    }
    void load();
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/cosign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName, signerTitle, note }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setState({ kind: "error", message: body.error ?? "Couldn't record your signature." });
      return;
    }
    setState({ kind: "done", signerName });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Link href="/"><Logo /></Link>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="shieldCheck" size={14} style={{ color: "var(--sage)" }} /> Single-use verification link
          </div>
        </div>

        {state.kind === "loading" ? (
          <Card padding={32}>
            <div className="plm-display-3" style={{ fontSize: 20 }}>Loading…</div>
          </Card>
        ) : null}

        {state.kind === "error" ? (
          <Card padding={32}>
            <div className="plm-eyebrow" style={{ color: "var(--coral-deep)" }}>Link unavailable</div>
            <h1 className="plm-display-2" style={{ fontSize: 32, marginTop: 8 }}>{state.message}</h1>
            <p style={{ color: "var(--ink-soft)", marginTop: 12 }}>
              If you think this is wrong, please ask the family for a fresh link.
            </p>
          </Card>
        ) : null}

        {state.kind === "ready" && state.data.achievement ? (
          <Card padding={32}>
            <div className="plm-eyebrow">Plume · Co-sign request</div>
            <h1 className="plm-display-2" style={{ fontSize: 40, marginTop: 8, lineHeight: 1.1 }}>
              Verify {state.data.achievement.child.fullName}&apos;s win
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 15, marginTop: 12 }}>
              A parent on Plume asked you to confirm this achievement. Your signature appears as a small verified badge on the public profile — no account needed.
            </p>

            <div style={{ background: "var(--surface-2)", borderRadius: 16, padding: 22, marginTop: 24 }}>
              <Chip size="sm" icon={categoryMeta(state.data.achievement.category).icon} tone={categoryMeta(state.data.achievement.category).tone}>
                {categoryMeta(state.data.achievement.category).label}
              </Chip>
              <div className="plm-display-3" style={{ fontSize: 24, marginTop: 12 }}>{state.data.achievement.title}</div>
              {state.data.achievement.description ? (
                <p style={{ color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.55 }}>{state.data.achievement.description}</p>
              ) : null}
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-mute)" }}>
                {state.data.achievement.child.school ? `${state.data.achievement.child.school} · ` : ""}
                {state.data.achievement.child.grade ?? ""}
              </div>
            </div>

            <form onSubmit={submit} style={{ marginTop: 24, display: "grid", gap: 14 }}>
              <Input label="Your name" placeholder="e.g. Mrs. Pillai" value={signerName} onChange={(e) => setSignerName(e.currentTarget.value)} required minLength={2} maxLength={80} />
              <Input label="Your title (optional)" placeholder="e.g. Art teacher" value={signerTitle} onChange={(e) => setSignerTitle(e.currentTarget.value)} maxLength={80} />
              <Textarea label="Note (optional)" placeholder="Anything you'd like the family to know about this win." rows={3} value={note} onChange={(e) => setNote(e.currentTarget.value)} maxLength={400} showCounter />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <Button type="submit" variant="primary" size="lg" icon="check" disabled={busy}>
                  {busy ? "Signing…" : "Confirm and sign"}
                </Button>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
                Your signature is recorded once, then this link expires.
              </div>
            </form>
          </Card>
        ) : null}

        {state.kind === "done" ? (
          <Card padding={32} style={{ background: "var(--sage-soft)", borderColor: "#6EE7B7" }}>
            <Icon name="shieldCheck" size={32} style={{ color: "var(--sage)" }} />
            <h1 className="plm-display-2" style={{ fontSize: 36, marginTop: 12, color: "#065F46" }}>
              Thanks, {state.signerName}.
            </h1>
            <p style={{ color: "#065F46", marginTop: 12, fontSize: 15 }}>
              Your signature is recorded. The family will see &ldquo;Verified by {state.signerName}&rdquo; on their public profile.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
