"use client";

/* Modals: AddChild, EditProfile, NewAchievement, EditAchievement, Reflection */

import { FormEvent, useEffect, useState } from "react";
import { Icon } from "@/app/components/icons";
import { Button, Input, Textarea, Modal, Chip, CATEGORIES, categoryMeta } from "@/app/components/ui";
import { FileUploadButton } from "@/app/components/file-upload-button";
import { Achievement, ChildProfileData } from "./shared";

/* ---------- Add Child ---------- */

export function AddChildModal({
  open,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  onError: (msg: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    grade: "",
    school: "",
    bio: "",
    funFact: "",
    skills: "",
    interests: "",
    location: "",
  });

  const reset = () => {
    setStep(1);
    setBusy(false);
    setData({ fullName: "", email: "", password: "", age: "", grade: "", school: "", bio: "", funFact: "", skills: "", interests: "", location: "" });
  };

  const close = () => { reset(); onClose(); };

  async function submit() {
    setBusy(true);
    const payload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      age: Number(data.age),
      grade: data.grade || undefined,
      school: data.school,
      bio: data.bio,
      funFact: data.funFact || undefined,
      skills: data.skills.split(",").map((x) => x.trim()).filter(Boolean),
      interests: data.interests.split(",").map((x) => x.trim()).filter(Boolean),
      location: data.location || undefined,
    };
    const res = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      onError(body.error ?? "Couldn't create child profile.");
      return;
    }
    await onCreated();
    close();
  }

  return (
    <Modal open={open} onClose={close} maxWidth={680} padding={0}>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr" }}>
        <div style={{ padding: 24, background: "var(--surface-2)", borderRight: "1px solid var(--line)", borderRadius: "20px 0 0 20px" }}>
          <div className="plm-eyebrow">New child</div>
          <div className="plm-display-3" style={{ fontSize: 20, marginTop: 6 }}>
            {step === 1 && "Who are they?"}
            {step === 2 && "Their school"}
            {step === 3 && "About them"}
          </div>
          <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
            {["Identity", "School", "Bio"].map((label, i) => (
              <div key={label} style={{ display: "flex", gap: 10, alignItems: "center", opacity: step >= i + 1 ? 1 : 0.4 }}>
                <div
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: step > i + 1 ? "var(--sage)" : step === i + 1 ? "var(--ink)" : "var(--line)",
                    color: step >= i + 1 ? "var(--surface)" : "var(--ink-mute)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500,
                  }}
                >
                  {step > i + 1 ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 28, position: "relative" }}>
          <button type="button" onClick={close} style={{ position: "absolute", top: 20, right: 20, color: "var(--ink-mute)" }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>

          <form
            onSubmit={(e: FormEvent) => { e.preventDefault(); if (step < 3) setStep(step + 1); else submit(); }}
            style={{ display: "grid", gap: 14 }}
          >
            {step === 1 ? (
              <>
                <Input label="Full name" placeholder="First Last" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.currentTarget.value })} minLength={2} maxLength={80} required />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Login email" icon="mail" placeholder="amara@example.com" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.currentTarget.value })} required />
                  <Input label="Age" type="number" min={5} max={19} placeholder="11" value={data.age} onChange={(e) => setData({ ...data, age: e.currentTarget.value })} required />
                </div>
                <Input label="Login password" icon="lock" type="password" placeholder="At least 8 characters" hint="You set this — share with your child after." value={data.password} onChange={(e) => setData({ ...data, password: e.currentTarget.value })} minLength={8} maxLength={100} required />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Input label="School" icon="school" placeholder="Dubai Modern Academy" value={data.school} onChange={(e) => setData({ ...data, school: e.currentTarget.value })} minLength={2} maxLength={120} required />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Grade / standard" placeholder="Grade 6" value={data.grade} onChange={(e) => setData({ ...data, grade: e.currentTarget.value })} />
                  <Input label="Location (optional)" icon="pin" placeholder="Dubai, UAE" value={data.location} onChange={(e) => setData({ ...data, location: e.currentTarget.value })} />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Textarea label="About them" rows={3} placeholder="A short intro — who they are, what they love." value={data.bio} onChange={(e) => setData({ ...data, bio: e.currentTarget.value })} maxLength={300} showCounter required minLength={8} />
                <Input label="A fun fact (optional)" placeholder="They can recite π to 40 digits." value={data.funFact} onChange={(e) => setData({ ...data, funFact: e.currentTarget.value })} maxLength={160} />
                <Input label="Skills" placeholder="Watercolor, Football, Piano" hint="Comma-separated. At least one." value={data.skills} onChange={(e) => setData({ ...data, skills: e.currentTarget.value })} required />
                <Input label="Interests" placeholder="Birds, Books, Lego" hint="Comma-separated. At least one." value={data.interests} onChange={(e) => setData({ ...data, interests: e.currentTarget.value })} required />
              </>
            ) : null}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              {step > 1 ? <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Back</Button> : <Button type="button" variant="outline" onClick={close}>Cancel</Button>}
              <div style={{ flex: 1 }} />
              <Button type="submit" variant="primary" iconRight={step < 3 ? "arrowRight" : "check"} disabled={busy}>
                {step < 3 ? "Continue" : busy ? "Creating…" : "Create profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Edit Profile ---------- */

export function EditProfileModal({
  open,
  onClose,
  childId,
  profile,
  onSaved,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
  profile: ChildProfileData;
  onSaved: () => void | Promise<void>;
  onError: (msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      age: Number(form.get("age") ?? profile.age),
      grade: String(form.get("grade") ?? ""),
      school: String(form.get("school") ?? ""),
      bio: String(form.get("bio") ?? ""),
      funFact: String(form.get("funFact") ?? ""),
      skills: String(form.get("skills") ?? "").split(",").map((x) => x.trim()).filter(Boolean),
      interests: String(form.get("interests") ?? "").split(",").map((x) => x.trim()).filter(Boolean),
      location: String(form.get("location") ?? ""),
    };

    const res = await fetch(`/api/children/${childId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      onError(body.error ?? "Couldn't save profile.");
      return;
    }
    await onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={640}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div className="plm-eyebrow">Edit profile</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Refine the portrait</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--ink-mute)" }} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Age" type="number" min={5} max={19} name="age" defaultValue={profile.age} required />
          <Input label="Grade / standard" name="grade" defaultValue={profile.grade ?? ""} placeholder="Grade 6" />
        </div>
        <Input label="School" icon="school" name="school" defaultValue={profile.school} required minLength={2} maxLength={120} />
        <Textarea label="About them" name="bio" defaultValue={profile.bio} rows={3} required minLength={8} maxLength={300} showCounter />
        <Input label="Fun fact" name="funFact" defaultValue={profile.funFact ?? ""} placeholder="Something only they would say." maxLength={160} />
        <Input label="Skills" name="skills" defaultValue={profile.skills.join(", ")} hint="Comma-separated." required />
        <Input label="Interests" name="interests" defaultValue={profile.interests.join(", ")} hint="Comma-separated." required />
        <Input label="Location" icon="pin" name="location" defaultValue={profile.location ?? ""} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon="check" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- New Achievement ---------- */

export function AchievementModal({
  open,
  onClose,
  children,
  defaultChildId,
  mode,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  children: { id: string; name: string }[];
  defaultChildId?: string;
  mode: "parent" | "child";
  onCreated: () => void | Promise<void>;
  onError: (msg: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{
    childId: string;
    category: string;
    title: string;
    description: string;
    proofUrl: string;
    proofFileUrl: string;
    proofHash: string;
    proofLabel: string;
  }>({
    childId: defaultChildId ?? children[0]?.id ?? "",
    category: "",
    title: "",
    description: "",
    proofUrl: "",
    proofFileUrl: "",
    proofHash: "",
    proofLabel: "",
  });

  const reset = () => {
    setStep(1);
    setBusy(false);
    setData({ childId: defaultChildId ?? children[0]?.id ?? "", category: "", title: "", description: "", proofUrl: "", proofFileUrl: "", proofHash: "", proofLabel: "" });
  };
  const close = () => { reset(); onClose(); };

  const m = data.category ? categoryMeta(data.category) : null;

  async function submit() {
    setBusy(true);
    const payload = {
      childId: mode === "parent" ? data.childId : undefined,
      title: data.title || "Untitled win",
      category: data.category || "OTHER",
      description: data.description || undefined,
      proofUrl: data.proofUrl || undefined,
      proofFileUrl: data.proofFileUrl || undefined,
      proofHash: data.proofHash || undefined,
    };
    const res = await fetch("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      onError(body.error ?? "Couldn't save achievement.");
      return;
    }
    await onCreated();
    close();
  }

  return (
    <Modal open={open} onClose={close} maxWidth={720} padding={0}>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" }}>
        <div style={{ padding: 28, background: "var(--surface-2)", borderRight: "1px solid var(--line)", borderRadius: "20px 0 0 20px" }}>
          <div className="plm-eyebrow">{mode === "parent" ? "Log a win" : "New win"}</div>
          <div className="plm-display-3" style={{ fontSize: 20, marginTop: 8 }}>
            {step === 1 && "Pick a category"}
            {step === 2 && "Tell the story"}
            {step === 3 && "Add proof"}
            {step === 4 && "Review"}
          </div>
          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            {["Category", "Story", "Proof", "Review"].map((label, i) => (
              <div key={label} style={{ display: "flex", gap: 10, alignItems: "center", opacity: step >= i + 1 ? 1 : 0.4 }}>
                <div
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: step > i + 1 ? "var(--sage)" : step === i + 1 ? "var(--ink)" : "var(--line)",
                    color: step >= i + 1 ? "var(--surface)" : "var(--ink-mute)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500,
                  }}
                >
                  {step > i + 1 ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          {mode === "child" ? (
            <div style={{ marginTop: 32, padding: 14, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--line)" }}>
              <Icon name="info" size={14} style={{ color: "var(--coral)" }} />
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>
                Your parent will see this and approve it before it goes live.
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ padding: 28, position: "relative" }}>
          <button onClick={close} style={{ position: "absolute", top: 20, right: 20, color: "var(--ink-mute)" }} aria-label="Close"><Icon name="x" size={18} /></button>

          {step === 1 ? (
            <div>
              {mode === "parent" && children.length > 1 ? (
                <>
                  <div className="plm-eyebrow" style={{ marginBottom: 10 }}>Whose win?</div>
                  <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
                    {children.map((k) => (
                      <button
                        type="button"
                        key={k.id}
                        onClick={() => setData({ ...data, childId: k.id })}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12,
                          border: `1px solid ${data.childId === k.id ? "var(--ink)" : "var(--line)"}`,
                          background: data.childId === k.id ? "var(--ink)" : "var(--surface)",
                          color: data.childId === k.id ? "var(--surface)" : "var(--ink)",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{k.name}</span>
                        {data.childId === k.id ? <Icon name="check" size={16} /> : null}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="plm-eyebrow" style={{ marginBottom: 10 }}>Pick a category</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setData({ ...data, category: c.value })}
                    style={{
                      padding: 18, borderRadius: 14,
                      border: `1px solid ${data.category === c.value ? "var(--ink)" : "var(--line)"}`,
                      background: data.category === c.value
                        ? c.tone === "neutral" ? "var(--surface-2)" : c.tone === "teal" ? "var(--teal-soft)" : `var(--${c.tone}-soft)`
                        : "var(--surface)",
                      textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    }}
                  >
                    <Icon
                      name={c.icon}
                      size={22}
                      style={{ color: data.category === c.value
                        ? c.tone === "neutral" ? "var(--ink)" : c.tone === "teal" ? "var(--teal)" : `var(--${c.tone})`
                        : "var(--ink-soft)" }}
                      strokeWidth={1.7}
                    />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div style={{ display: "grid", gap: 14 }}>
              <Input label="Title" placeholder="What was it called?" value={data.title} onChange={(e) => setData({ ...data, title: e.currentTarget.value })} hint="Keep it short. The piece, the prize, the match." />
              <Textarea label="Tell the story" placeholder="Who, where, what makes you proud about this one…" value={data.description} onChange={(e) => setData({ ...data, description: e.currentTarget.value })} rows={4} maxLength={350} showCounter />
              <Input label="External link (optional)" icon="link" placeholder="A video URL, certificate page…" value={data.proofUrl} onChange={(e) => setData({ ...data, proofUrl: e.currentTarget.value })} />
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <div className="plm-eyebrow" style={{ marginBottom: 10 }}>Add proof</div>
              <div
                style={{
                  padding: 32,
                  border: "1px dashed var(--line-strong)",
                  borderRadius: 16,
                  textAlign: "center",
                  background: data.proofFileUrl ? "var(--sage-soft)" : "var(--surface-2)",
                  transition: "background 0.16s ease",
                }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: data.proofFileUrl ? "var(--sage)" : "var(--surface)",
                    color: data.proofFileUrl ? "var(--surface)" : "var(--ink-soft)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    border: data.proofFileUrl ? "none" : "1px solid var(--line)",
                  }}
                >
                  <Icon name={data.proofFileUrl ? "check" : "upload"} size={20} strokeWidth={2} />
                </div>
                <div className="plm-display-3" style={{ fontSize: 18, marginTop: 12 }}>
                  {data.proofFileUrl ? `${data.proofLabel || "File uploaded"}` : "Drop a certificate, photo, or video"}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 6 }}>
                  {data.proofFileUrl ? "Looks good. You can swap it any time." : "PNG, JPG, WEBP, PDF · up to 5 MB"}
                </div>
                {!data.proofFileUrl ? (
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                    <FileUploadButton
                      kind="proof"
                      label="Upload file"
                      variant="primary"
                      size="md"
                      onUploaded={(url, meta) => setData({ ...data, proofFileUrl: url, proofHash: meta?.sha256 ?? "", proofLabel: url.split("/").pop() ?? "File" })}
                      onError={onError}
                    />
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 16, padding: 14, background: "var(--surface-2)", borderRadius: 12, fontSize: 12, color: "var(--ink-soft)", display: "flex", gap: 10 }}>
                <Icon name="shield" size={14} style={{ color: "var(--sage)", flexShrink: 0, marginTop: 2 }} />
                Files are stored privately. They only appear on the public profile if you publish the achievement, and only a parent can publish.
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <div className="plm-eyebrow" style={{ marginBottom: 12 }}>Review</div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  {m ? (
                    <div
                      style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: m.tone === "neutral" ? "var(--surface-2)" : m.tone === "teal" ? "var(--teal-soft)" : `var(--${m.tone}-soft)`,
                        color: m.tone === "neutral" ? "var(--ink-soft)" : m.tone === "teal" ? "var(--teal)" : `var(--${m.tone})`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon name={m.icon} size={22} strokeWidth={1.7} />
                    </div>
                  ) : null}
                  <div style={{ flex: 1 }}>
                    {m ? <Chip size="sm" tone={m.tone}>{m.label}</Chip> : null}
                    <div className="plm-display-3" style={{ fontSize: 20, marginTop: 6 }}>{data.title || "Untitled win"}</div>
                  </div>
                </div>
                {data.description ? <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 14, lineHeight: 1.5 }}>{data.description}</p> : null}
                {data.proofFileUrl ? (
                  <div style={{ marginTop: 14, padding: "8px 12px", background: "var(--sage-soft)", borderRadius: 10, fontSize: 12, color: "#065F46", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="check" size={12} strokeWidth={2.4} /> Proof attached
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 16, padding: 14, background: mode === "child" ? "var(--amber-mute)" : "var(--sage-soft)", borderRadius: 12, fontSize: 13, color: mode === "child" ? "#92400E" : "#065F46", display: "flex", gap: 10, alignItems: "center" }}>
                <Icon name={mode === "child" ? "clock" : "checkCircle"} size={16} />
                {mode === "child" ? "Your parent will see this in their review queue." : "This will publish immediately to your child's profile."}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 1 ? <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button> : null}
            <div style={{ flex: 1 }} />
            {step < 4 ? (
              <Button
                variant="primary"
                iconRight="arrowRight"
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && (!data.category || (mode === "parent" && !data.childId))) || (step === 2 && !data.title)}
              >
                Continue
              </Button>
            ) : (
              <Button variant="coral" icon="check" onClick={submit} disabled={busy}>
                {busy ? "Saving…" : mode === "child" ? "Submit for approval" : "Publish to portfolio"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Edit Achievement (parent's "Edit first" flow) ---------- */

export function EditAchievementModal({
  open,
  onClose,
  achievement,
  onSaved,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  achievement: Achievement;
  onSaved: (result: { approved: boolean }) => void | Promise<void>;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState(achievement.title);
  const [category, setCategory] = useState<string>(achievement.category);
  const [description, setDescription] = useState(achievement.description ?? "");
  const [proofUrl, setProofUrl] = useState(achievement.proofUrl ?? "");
  const [proofFileUrl, setProofFileUrl] = useState(achievement.proofFileUrl ?? "");
  const [busy, setBusy] = useState<null | "save" | "approve">(null);

  async function submit(approveAfter: boolean) {
    setBusy(approveAfter ? "approve" : "save");
    const payload: Record<string, unknown> = {
      title,
      category,
      description: description || undefined,
      proofUrl: proofUrl || undefined,
      proofFileUrl: proofFileUrl || undefined,
    };
    if (approveAfter) payload.isApproved = true;

    const res = await fetch(`/api/admin/achievements/${achievement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      onError(body.error ?? "Couldn't save changes.");
      return;
    }
    await onSaved({ approved: approveAfter });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={640}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div className="plm-eyebrow">Edit first</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 4vw, 28px)", marginTop: 6 }}>Refine before publishing</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--ink-mute)" }} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>

      <form onSubmit={(e: FormEvent) => { e.preventDefault(); submit(true); }} style={{ display: "grid", gap: 14 }}>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} minLength={2} maxLength={120} required />

        <div>
          <div className="plm-label">Category</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
                    background: active ? "var(--surface-2)" : "var(--surface)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon name={c.icon} size={14} style={{ color: active ? "var(--ink)" : "var(--ink-soft)" }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={3}
          maxLength={350}
          showCounter
        />

        <Input
          label="External link (optional)"
          icon="link"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.currentTarget.value)}
        />

        <div>
          <div className="plm-label">Proof file</div>
          {proofFileUrl ? (
            <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
              {(() => {
                const m = categoryMeta(category);
                return <Chip tone={m.tone} size="sm">{(proofFileUrl.split("/").pop() ?? "file").slice(0, 40)}</Chip>;
              })()}
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => setProofFileUrl("")} style={{ color: "var(--ink-mute)", fontSize: 12, textDecoration: "underline" }}>
                Remove
              </button>
            </div>
          ) : (
            <FileUploadButton
              kind="proof"
              label="Replace file"
              variant="cream"
              onUploaded={setProofFileUrl}
              onError={onError}
            />
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <div style={{ flex: 1 }} />
          <Button type="button" variant="cream" icon="check" onClick={() => submit(false)} disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save edits only"}
          </Button>
          <Button type="submit" variant="primary" icon="check" disabled={busy !== null}>
            {busy === "approve" ? "Publishing…" : "Save & approve"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Reflection (private — saved only on this device) ---------- */

const REFLECTION_PROMPTS: string[] = [
  "What's something you tried this week that didn't quite work — but you learned from anyway?",
  "Which win this week surprised you the most, and why?",
  "What's one skill you'd like to be a little better at by next month?",
  "Who helped you this week — a teacher, friend, or family member?",
  "What's a small step you took today that future-you will thank you for?",
  "Describe one moment this week when you felt proud of yourself.",
  "What's something you found tough at first that's getting easier?",
];

export function reflectionPromptForToday() {
  // Stable per-day prompt that rotates through the list.
  const now = new Date();
  const day = Math.floor(now.getTime() / 86400000);
  return REFLECTION_PROMPTS[day % REFLECTION_PROMPTS.length];
}

function reflectionStorageKey(childId: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `plm.reflection.${childId}.${y}-${m}-${d}`;
}

export function ReflectionModal({
  open,
  onClose,
  childId,
  prompt,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
  prompt: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const stored = window.localStorage.getItem(reflectionStorageKey(childId));
      if (stored) {
        const parsed = JSON.parse(stored) as { text: string; savedAt: string };
        setText(parsed.text);
        setSaved(parsed.savedAt);
      } else {
        setText("");
        setSaved(null);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [open, childId]);

  function save() {
    const payload = { text, savedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(reflectionStorageKey(childId), JSON.stringify(payload));
      setSaved(payload.savedAt);
    } catch {
      /* ignore */
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={580}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="plm-eyebrow">Today&apos;s reflection</div>
          <div className="plm-display-2" style={{ fontSize: "clamp(20px, 3.5vw, 26px)", marginTop: 6, lineHeight: 1.2 }}>{prompt}</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--ink-mute)" }} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 10, fontSize: 12, color: "var(--ink-soft)", display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <Icon name="lock" size={14} style={{ color: "var(--ink-mute)" }} />
        Stays on this device — never shared, never posted.
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        rows={6}
        maxLength={1200}
        showCounter
        placeholder="Write a sentence or two. Nobody else will see it."
      />
      {saved ? (
        <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 8 }}>
          Saved {new Date(saved).toLocaleString()}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
        <Button type="button" variant="outline" onClick={onClose}>Maybe later</Button>
        <Button type="button" variant="primary" icon="check" onClick={save} disabled={text.trim().length === 0}>
          {saved ? "Update" : "Save reflection"}
        </Button>
      </div>
    </Modal>
  );
}
