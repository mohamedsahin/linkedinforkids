"use client";

/**
 * Lightweight, dependency-free motion primitives — the shared animation
 * foundation for the platform. Everything here respects
 * `prefers-reduced-motion` and degrades to an instant, static result.
 */

import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Animated number that counts up to `value` when it first renders. */
export function CountUp({
  value,
  duration = 900,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    let raf = 0;
    // Reduced motion (or zero duration): jump to the value on the next frame.
    if (prefersReducedMotion() || duration <= 0) {
      raf = requestAnimationFrame(() => {
        setDisplay(value);
        fromRef.current = value;
      });
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

/** Animated circular progress ring (SVG). */
export function ProgressRing({
  value,
  size = 116,
  stroke = 11,
  trackColor = "rgba(15, 23, 42, 0.08)",
  color = "var(--brand)",
  children,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  trackColor?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  const [shown, setShown] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    // Animate on the next frame so the CSS transition runs from 0 → value.
    // Reduced-motion users get an instant fill via the CSS media query.
    const id = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const offset = circumference - (shown / 100) * circumference;

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      role="img"
      aria-label={`${clamped}% complete`}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gam-ring-fill"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Animated horizontal bar fill (0–100). */
export function ProgressBar({
  value,
  color = "var(--brand)",
  height = 12,
  className,
}: {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    // Animate on the next frame; CSS disables the transition under reduced motion.
    const id = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  return (
    <div
      className={`gam-bar-track ${className ?? ""}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="gam-bar-fill"
        style={{ width: `${shown}%`, background: color }}
      />
    </div>
  );
}

/**
 * Reveals its children with a fade/slide as they scroll into view. Stagger
 * children by passing an incremental `delay`.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "article" | "section" | "li" | "span";
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  // Cast to a single element type so the dynamic tag doesn't widen to the full
  // intrinsic-element union (which would break ref typing).
  const Tag = as as "div";

  useEffect(() => {
    const node = ref.current;
    if (prefersReducedMotion() || !node) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
