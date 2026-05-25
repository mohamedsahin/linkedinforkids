"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { Logo } from "./ui";

export function AuthShell({ side, children }: { side: ReactNode; children: ReactNode }) {
  return (
    <div className="plm-auth-shell">
      <div className="plm-auth-form" style={{ display: "flex", flexDirection: "column", padding: "40px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/"><Logo size={22} /></Link>
          <Link href="/" style={{ fontSize: 13, color: "var(--ink-soft)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="arrowLeft" size={14} /> Back to home
          </Link>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>{children}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>© 2026 Plume</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a>Privacy</a><a>Terms</a><a>Help</a>
          </div>
        </div>
      </div>
      <div
        className="plm-auth-side"
        style={{
          background: "var(--ink)", color: "var(--surface)",
          padding: 48, position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}
      >
        <div style={{ position: "absolute", inset: "-20% -10% auto auto", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 65%)" }} />
        {side}
      </div>
    </div>
  );
}
