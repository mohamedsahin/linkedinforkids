import { CSSProperties } from "react";

const PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: "#DBEAFE", fg: "#1D4ED8" }, // blue
  { bg: "#FEF3C7", fg: "#92400E" }, // yellow
  { bg: "#D1FAE5", fg: "#065F46" }, // green
  { bg: "#F3E8FF", fg: "#6B21A8" }, // purple
  { bg: "#CFFAFE", fg: "#155E75" }, // cyan
];

function pickColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

type Props = {
  name: string;
  photoUrl?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
};

export function ProfileAvatar({
  name,
  photoUrl,
  size = 48,
  ring = false,
  className = "",
}: Props) {
  const c = pickColor(name || "kid");
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: photoUrl ? "#fff" : c.bg,
    color: c.fg,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-instrument-serif)",
    fontWeight: 400,
    fontSize: Math.max(14, Math.floor(size * 0.42)),
    letterSpacing: "-0.01em",
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    boxShadow: ring
      ? "0 0 0 3px var(--surface), 0 0 0 5px var(--coral-soft)"
      : "none",
  };

  if (photoUrl) {
    return (
      <span style={style} className={className} aria-label={`${name}'s photo`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
    );
  }

  return (
    <span style={style} className={className} aria-label={`${name} avatar`}>
      {initials(name)}
    </span>
  );
}
