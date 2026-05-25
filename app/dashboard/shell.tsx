"use client";

/* Reusable bits used across parent / child / admin dashboard views. */

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/app/components/icon";
import { Button, Logo } from "@/app/components/ui";
import { ProfileAvatar } from "@/app/components/profile-avatar";

type Role = "PARENT" | "CHILD" | "ADMIN";

export type SidebarItem = { id: string; label: string; icon: IconName; count?: number };

export type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
};

export type PlanCard = {
  eyebrow: string;
  title: string;
  renews?: string;
  cta?: { label: string; onClick: () => void };
};

export function DashboardShell({
  role,
  user,
  sidebar,
  active,
  onSelect,
  currentScreenLabel,
  pendingCount = 0,
  notifications = [],
  onOpenNotifications,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  planCard,
  headerRight,
  onLogout,
  children,
}: {
  role: Role;
  user: { fullName: string; email: string };
  sidebar: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
  currentScreenLabel: string;
  pendingCount?: number;
  notifications?: NotificationItem[];
  onOpenNotifications?: () => void;
  searchValue?: string;
  onSearchChange?: (next: string) => void;
  searchPlaceholder?: string;
  planCard?: PlanCard;
  headerRight?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
}) {
  const roleLabel = role === "PARENT" ? "Parent" : role === "CHILD" ? "Child" : "Admin";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Lock body scroll + Esc-to-close while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  // Close the drawer when the user picks a nav item from inside it.
  function selectAndClose(id: string) {
    onSelect(id);
    setDrawerOpen(false);
  }

  // Top 4 sidebar items go to the bottom tab bar; anything else lives in the drawer.
  const primaryTabs = sidebar.slice(0, 4);
  const overflowTabs = sidebar.slice(4);

  return (
    <div className="plm-shell">
      {/* Sidebar — desktop only */}
      <aside
        className="plm-shell-sidebar"
        style={{ alignSelf: "start" }}
      >
        <div style={{ padding: "0 8px 24px" }}>
          <Link href="/dashboard"><Logo size={20} /></Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", background: "var(--surface-2)", borderRadius: 14, marginBottom: 20 }}>
          <ProfileAvatar name={user.fullName} size={36} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        </div>

        <div className="plm-eyebrow" style={{ padding: "0 10px 8px" }}>Menu</div>
        <nav style={{ display: "grid", gap: 2 }}>
          {sidebar.map((it) => {
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                onClick={() => onSelect(it.id)}
                className="plm-nav-item"
                data-active={isActive ? "true" : "false"}
              >
                <Icon name={it.icon} size={16} strokeWidth={isActive ? 2 : 1.6} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.count != null && it.count > 0 ? (
                  <span
                    style={{
                      background: isActive ? "var(--coral)" : "var(--coral-mute)",
                      color: isActive ? "var(--surface)" : "var(--coral-deep)",
                      padding: "1px 7px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >{it.count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
          {planCard ? (
            <div style={{ background: "var(--ink)", color: "var(--surface)", padding: 16, borderRadius: 14 }}>
              <div className="plm-eyebrow" style={{ color: "var(--amber-soft)", marginBottom: 6 }}>{planCard.eyebrow}</div>
              <div className="plm-display-3" style={{ fontSize: 18, color: "var(--surface)" }}>{planCard.title}</div>
              {planCard.renews ? (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{planCard.renews}</div>
              ) : null}
              {planCard.cta ? (
                <Button
                  variant="cream"
                  size="sm"
                  full
                  style={{ marginTop: 12 }}
                  onClick={planCard.cta.onClick}
                >
                  {planCard.cta.label}
                </Button>
              ) : null}
            </div>
          ) : null}
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ink-soft)",
              textAlign: "left",
            }}
          >
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ minWidth: 0 }}>
        {/* Mobile top bar (hidden on desktop via CSS). */}
        <div className="plm-shell-topbar">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--line)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="menu" size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div className="plm-eyebrow" style={{ fontSize: 9 }}>{roleLabel} workspace</div>
            <div className="plm-display-3" style={{ fontSize: 16, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentScreenLabel}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {onSearchChange ? (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setMobileSearchOpen((v) => !v)}
                style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="search" size={16} />
              </button>
            ) : null}
            <NotificationsBell
              pendingCount={pendingCount}
              items={notifications}
              onOpenAll={onOpenNotifications}
            />
          </div>
        </div>

        {/* Mobile inline search sheet — slides under the topbar. */}
        {onSearchChange && mobileSearchOpen ? (
          <div className="plm-only-tablet" style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 999, fontSize: 14 }}>
              <Icon name="search" size={14} style={{ color: "var(--ink-mute)" }} />
              <input
                type="search"
                autoFocus
                placeholder={searchPlaceholder}
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink)" }}
              />
              {searchValue ? (
                <button type="button" aria-label="Clear" onClick={() => onSearchChange("")} style={{ color: "var(--ink-mute)" }}>
                  <Icon name="x" size={14} />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Desktop sticky header. */}
        <header className="plm-app-header">
          <div>
            <div className="plm-eyebrow">{roleLabel} workspace</div>
            <div className="plm-display-3" style={{ fontSize: 22, marginTop: 2 }}>{currentScreenLabel}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onSearchChange ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 13,
                }}
              >
                <Icon name="search" size={14} style={{ color: "var(--ink-mute)" }} />
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange(e.currentTarget.value)}
                  style={{
                    border: 0,
                    outline: 0,
                    background: "transparent",
                    width: 180,
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                />
              </div>
            ) : null}
            <NotificationsBell
              pendingCount={pendingCount}
              items={notifications}
              onOpenAll={onOpenNotifications}
            />
            {headerRight}
          </div>
        </header>

        {/* Mobile-only floating primary action — pin the headerRight CTA to the
            bottom of the topbar so the parent's "Log a win" stays one tap away. */}
        {headerRight ? (
          <div className="plm-only-tablet" style={{ padding: "10px 16px 0" }}>
            {headerRight}
          </div>
        ) : null}

        <div className="plm-shell-main-pad">{children}</div>
      </main>

      {/* Mobile bottom tab bar. */}
      <nav className="plm-bottom-nav" aria-label="Primary">
        {primaryTabs.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className="plm-bottom-tab"
            data-active={active === it.id ? "true" : "false"}
            aria-label={it.label}
          >
            <Icon name={it.icon} size={20} strokeWidth={active === it.id ? 2.2 : 1.7} />
            <span>{it.label}</span>
            {it.count != null && it.count > 0 ? (
              <span className="plm-bottom-tab-badge">{it.count > 99 ? "99+" : it.count}</span>
            ) : null}
          </button>
        ))}
        {overflowTabs.length > 0 ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="plm-bottom-tab"
            aria-label="More"
          >
            <Icon name="moreHorizontal" size={20} strokeWidth={1.7} />
            <span>More</span>
          </button>
        ) : null}
      </nav>

      {/* Mobile drawer (full sidebar contents). */}
      <div className="plm-drawer-backdrop" data-open={drawerOpen ? "true" : "false"} onClick={() => setDrawerOpen(false)} />
      <aside className="plm-drawer-panel" data-open={drawerOpen ? "true" : "false"} aria-hidden={drawerOpen ? "false" : "true"}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <Logo size={20} />
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ color: "var(--ink-mute)" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", background: "var(--surface-2)", borderRadius: 14, marginBottom: 20 }}>
          <ProfileAvatar name={user.fullName} size={36} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        </div>

        <div className="plm-eyebrow" style={{ padding: "0 4px 8px" }}>Menu</div>
        <nav style={{ display: "grid", gap: 2 }}>
          {sidebar.map((it) => {
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                onClick={() => selectAndClose(it.id)}
                className="plm-nav-item"
                data-active={isActive ? "true" : "false"}
              >
                <Icon name={it.icon} size={16} strokeWidth={isActive ? 2 : 1.6} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.count != null && it.count > 0 ? (
                  <span
                    style={{
                      background: isActive ? "var(--coral)" : "var(--coral-mute)",
                      color: isActive ? "var(--surface)" : "var(--coral-deep)",
                      padding: "1px 7px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >{it.count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", display: "grid", gap: 10, paddingTop: 24 }}>
          {planCard ? (
            <div style={{ background: "var(--ink)", color: "var(--surface)", padding: 16, borderRadius: 14 }}>
              <div className="plm-eyebrow" style={{ color: "var(--amber-soft)", marginBottom: 6 }}>{planCard.eyebrow}</div>
              <div className="plm-display-3" style={{ fontSize: 18, color: "var(--surface)" }}>{planCard.title}</div>
              {planCard.renews ? (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{planCard.renews}</div>
              ) : null}
              {planCard.cta ? (
                <Button variant="cream" size="sm" full style={{ marginTop: 12 }} onClick={() => { planCard.cta?.onClick(); setDrawerOpen(false); }}>
                  {planCard.cta.label}
                </Button>
              ) : null}
            </div>
          ) : null}
          <button
            onClick={() => { onLogout(); setDrawerOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px", borderRadius: 10, fontSize: 14,
              color: "var(--ink-soft)", textAlign: "left", background: "transparent", border: "1px solid var(--line)",
            }}
          >
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Notifications bell ---------- */

function NotificationsBell({
  pendingCount,
  items,
  onOpenAll,
}: {
  pendingCount: number;
  items: NotificationItem[];
  onOpenAll?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        style={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="bell" size={16} />
        {pendingCount > 0 ? (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: "var(--coral)",
              borderRadius: "50%",
              border: "2px solid var(--surface)",
            }}
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 340,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="plm-eyebrow">Notifications</div>
            <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
              {pendingCount > 0 ? `${pendingCount} pending` : "All clear"}
            </span>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>
              You&apos;re all caught up.
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {items.slice(0, 6).map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { onOpenAll?.(); setOpen(false); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    borderBottom: i < Math.min(5, items.length - 1) ? "1px solid var(--line)" : "none",
                    background: "transparent",
                    display: "block",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35 }}>{n.title}</div>
                  {n.subtitle ? (
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{n.subtitle}</div>
                  ) : null}
                  {n.meta ? (
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em" }}>{n.meta}</div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          {onOpenAll ? (
            <button
              type="button"
              onClick={() => { onOpenAll(); setOpen(false); }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderTop: "1px solid var(--line)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--coral-deep)",
                background: "var(--surface-2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              Open review queue <Icon name="arrowRight" size={13} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Toast ---------- */

export function Toast({ message, tone = "success" }: { message: string; tone?: "success" | "warn" | "error" }) {
  const iconName: IconName = tone === "warn" ? "info" : tone === "error" ? "info" : "check";
  const accentColor =
    tone === "warn" ? "var(--amber-soft)" :
    tone === "error" ? "var(--coral-soft)" :
    "#6EE7B7";

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
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
        zIndex: 90,
      }}
    >
      <Icon name={iconName} size={14} strokeWidth={2.2} style={{ color: accentColor }} />
      {message}
    </div>
  );
}
