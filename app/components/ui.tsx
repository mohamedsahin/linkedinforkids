"use client";

/**
 * Plume — shared UI primitives. Buttons, inputs, cards, chips, badges, toggle, modal.
 * Match the design language declared in tokens (warm cream + coral + serif display).
 */

import {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useEffect,
  useState,
} from "react";
import { Icon, IconName } from "./icon";

/* ----------------------------- Button ----------------------------- */

type ButtonVariant = "primary" | "coral" | "amber" | "cream" | "outline" | "ghost" | "danger" | "on-dark";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;
  return (
    <button
      type="button"
      {...rest}
      className={`plm-btn plm-btn-${size} plm-btn-${variant} ${full ? "plm-btn-full" : ""} ${className}`}
    >
      {icon && <Icon name={icon} size={iconSize} strokeWidth={1.8} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} strokeWidth={1.8} />}
    </button>
  );
}

/* ----------------------------- Card ----------------------------- */

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: number;
  hover?: boolean;
};

export function Card({ padding = 24, hover, children, className = "", style, ...rest }: CardProps) {
  // Bigger paddings (>= 20) scale down on narrow viewports so cards don't burn
  // half the screen on a phone. Smaller paddings pass through untouched.
  const responsivePadding =
    padding >= 20
      ? `clamp(${Math.max(14, Math.round(padding * 0.5))}px, 4.5vw, ${padding}px)`
      : padding;
  return (
    <div
      {...rest}
      className={`plm-card ${hover ? "plm-card-hover" : ""} ${className}`}
      style={{ padding: responsivePadding, ...style }}
    >
      {children}
    </div>
  );
}

/* ----------------------------- Input ----------------------------- */

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  suffix?: ReactNode;
  fullWidth?: boolean;
};

export function Input({ label, hint, error, icon, suffix, fullWidth = true, className = "", ...rest }: InputProps) {
  return (
    <label style={{ display: "block", width: fullWidth ? "100%" : "auto" }}>
      {label ? <div className="plm-label">{label}</div> : null}
      <div className={`plm-field-wrap ${error ? "plm-field-error" : ""}`}>
        {icon ? <span className="plm-field-icon"><Icon name={icon} size={16} /></span> : null}
        <input className={className} {...rest} />
        {suffix ? <span style={{ color: "var(--ink-mute)", display: "inline-flex" }}>{suffix}</span> : null}
      </div>
      {hint && !error ? <div className="plm-hint">{hint}</div> : null}
      {error ? <div className="plm-error">{error}</div> : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  showCounter?: boolean;
};

export function Textarea({ label, hint, showCounter, maxLength, value, className = "", ...rest }: TextareaProps) {
  const v = typeof value === "string" ? value : "";
  return (
    <label style={{ display: "block", width: "100%" }}>
      {label ? <div className="plm-label">{label}</div> : null}
      <div className="plm-field-wrap" style={{ padding: "10px 14px" }}>
        <textarea value={value} maxLength={maxLength} className={className} {...rest} style={{ resize: "vertical" }} />
      </div>
      {(hint || (showCounter && maxLength)) ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-mute)", marginTop: 6 }}>
          <span>{hint}</span>
          {showCounter && maxLength ? <span>{v.length} / {maxLength}</span> : null}
        </div>
      ) : null}
    </label>
  );
}

/* ----------------------------- Chip ----------------------------- */

type ChipTone = "neutral" | "coral" | "amber" | "sage" | "plum" | "teal" | "dark" | "ghost";

type ChipProps = {
  children: ReactNode;
  tone?: ChipTone;
  icon?: IconName;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  style?: CSSProperties;
};

export function Chip({ children, tone = "neutral", icon, size = "md", active, onClick, onRemove, style }: ChipProps) {
  const iconSize = size === "sm" ? 11 : size === "lg" ? 14 : 13;
  return (
    <span
      onClick={onClick}
      className={`plm-chip plm-chip-${size} ${tone !== "neutral" ? `plm-chip-${tone}` : ""}`}
      style={{
        cursor: onClick ? "pointer" : "default",
        ...(active ? { background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" } : {}),
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={iconSize} strokeWidth={2} /> : null}
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ display: "inline-flex", marginLeft: 2, color: "inherit", opacity: 0.6 }}
        >
          <Icon name="x" size={iconSize} strokeWidth={2} />
        </button>
      ) : null}
    </span>
  );
}

/* ----------------------------- Badge ----------------------------- */

type BadgeTone = "neutral" | "success" | "warn" | "danger" | "info";
type BadgeProps = { children: ReactNode; tone?: BadgeTone; dot?: boolean };

export function Badge({ children, tone = "neutral", dot }: BadgeProps) {
  return (
    <span className={`plm-badge ${tone !== "neutral" ? `plm-badge-${tone}` : ""} ${dot ? "plm-badge-dot" : ""}`}>
      {children}
    </span>
  );
}

/* ----------------------------- Toggle ----------------------------- */

type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, sublabel, disabled }: ToggleProps) {
  return (
    <label
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
      }}
    >
      {(label || sublabel) ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          {label ? <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{label}</div> : null}
          {sublabel ? <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{sublabel}</div> : null}
        </div>
      ) : null}
      <span
        role="switch"
        aria-checked={checked}
        data-on={checked ? "true" : "false"}
        className="plm-toggle"
        onClick={() => !disabled && onChange(!checked)}
      />
    </label>
  );
}

/* ----------------------------- Modal ----------------------------- */

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  padding?: number;
};

export function Modal({ open, onClose, children, maxWidth = 560, padding = 28 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="plm-modal-backdrop" onClick={onClose}>
      <div
        className="plm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, padding }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- Logo ----------------------------- */

export function Logo({ size = 22, color = "var(--ink)" }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 21V5c0-1 .8-2 2-2h6a6 6 0 0 1 0 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="6" r="1.4" fill="var(--coral)" />
      </svg>
      <span style={{ fontFamily: "var(--font-instrument-serif)", fontSize: size * 1.05, letterSpacing: "-0.015em", color, lineHeight: 1 }}>
        Plume
      </span>
    </span>
  );
}

/* ----------------------------- Section header ----------------------------- */

export function SectionHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <div>
        {eyebrow ? <div className="plm-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div> : null}
        <div className="plm-display-3" style={{ fontSize: 28 }}>{title}</div>
        {sub ? <div style={{ marginTop: 4, color: "var(--ink-soft)", fontSize: 14 }}>{sub}</div> : null}
      </div>
      {right}
    </div>
  );
}

/* ----------------------------- Image placeholder ----------------------------- */

type ImgTone = "amber" | "coral" | "sage" | "plum" | "cream" | "teal";

const placeholderTones: Record<ImgTone, { bg: string; color: string; stripe: string }> = {
  amber: { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", color: "#92400E",        stripe: "#FACC15" },
  coral: { bg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)", color: "#1D4ED8",        stripe: "#93C5FD" },
  sage:  { bg: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)", color: "#065F46",        stripe: "#6EE7B7" },
  plum:  { bg: "linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)", color: "#6B21A8",        stripe: "#D8B4FE" },
  cream: { bg: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)", color: "var(--ink-soft)", stripe: "var(--line-strong)" },
  teal:  { bg: "linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)", color: "#155E75",        stripe: "#67E8F9" },
};

export function ImgPlaceholder({
  label = "image",
  aspect = "4 / 3",
  tone = "amber",
  style = {},
}: { label?: string; aspect?: string; tone?: ImgTone | ChipTone; style?: CSSProperties }) {
  const t = placeholderTones[tone as ImgTone] ?? placeholderTones.cream;
  return (
    <div
      className="plm-img-placeholder"
      style={{
        aspectRatio: aspect,
        width: "100%",
        background: t.bg,
        backgroundImage: `${t.bg}, repeating-linear-gradient(135deg, ${t.stripe} 0 1px, transparent 1px 14px)`,
        color: t.color,
        ...style,
      }}
    >
      <span className="plm-label">{label}</span>
    </div>
  );
}

/* ----------------------------- Empty ----------------------------- */

export function Empty({ icon = "feather", title, sub, action }: { icon?: IconName; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="plm-empty">
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--line)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
        <Icon name={icon} size={20} />
      </div>
      <div className="plm-display-3" style={{ fontSize: 19, marginTop: 14, color: "var(--ink)" }}>{title}</div>
      {sub ? <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4, maxWidth: 380, marginInline: "auto" }}>{sub}</div> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

/* ----------------------------- Categories ----------------------------- */

// Re-exported from the server-safe module so existing imports keep working.
export { CATEGORIES, categoryMeta } from "@/lib/categories";
export type { CategoryValue, CategoryMeta, CategoryTone } from "@/lib/categories";

/* ----------------------------- Toast (simple inline) ----------------------------- */

export function Toast({ message, tone = "success" }: { message: string; tone?: "success" | "warn" | "info" }) {
  const iconName: IconName = tone === "warn" ? "info" : tone === "info" ? "info" : "check";
  return (
    <div
      role="status"
      style={{
        background: "var(--ink)",
        color: "var(--surface)",
        padding: "10px 18px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <Icon name={iconName} size={14} strokeWidth={2.2} style={{ color: tone === "warn" ? "var(--amber-soft)" : "#6EE7B7" }} />
      {message}
    </div>
  );
}

/* ----------------------------- Progress ----------------------------- */

export function ProgressLine({ value = 0, max = 100, tone = "coral" }: { value?: number; max?: number; tone?: "coral" | "amber" | "sage" }) {
  return (
    <div className="plm-progress">
      <div
        className="plm-progress-fill"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: `var(--${tone})` }}
      />
    </div>
  );
}

/* ----------------------------- Count up (client-only) ----------------------------- */

export function Count({ to = 0, duration = 900, prefix = "", suffix = "" }: { to?: number; duration?: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span>{prefix}{v.toLocaleString()}{suffix}</span>;
}

/* ----------------------------- Field row (display) ----------------------------- */

export function Field({ label, value, icon }: { label: string; value?: ReactNode; icon?: IconName }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
      {icon ? (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", color: "var(--ink-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={icon} size={15} />
        </div>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="plm-eyebrow">{label}</div>
        <div style={{ fontSize: 15, color: "var(--ink)", marginTop: 2 }}>
          {value || <span style={{ color: "var(--ink-mute)", fontStyle: "italic" }}>Not set</span>}
        </div>
      </div>
    </div>
  );
}
