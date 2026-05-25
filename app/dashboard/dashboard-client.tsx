"use client";

/**
 * Dashboard client — top-level orchestrator that fetches /api/me,
 * /api/admin/overview, /api/admin/users (when admin), and routes to the
 * right role-specific view.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MeResponse, User, AdminOverview, AdminUser,
  AdminSchool, AdminReviewer, AdminConfigShape,
} from "./shared";
import { ParentDashboard } from "./parent-view";
import { ChildDashboard } from "./child-view";
import { AdminDashboard } from "./admin-view";
import { Toast } from "./shell";

export default function DashboardClient({ initialUser }: { initialUser: User }) {
  const router = useRouter();
  const [user, setUser] = useState<User>(initialUser);
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [adminData, setAdminData] = useState<AdminOverview | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[] | null>(null);
  const [adminSchools, setAdminSchools] = useState<AdminSchool[] | null>(null);
  const [adminReviewers, setAdminReviewers] = useState<AdminReviewer[] | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfigShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);

    const meRes = await fetch("/api/me", { cache: "no-store" });
    if (!meRes.ok) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    const me = (await meRes.json()) as MeResponse;
    setUser(me.user);
    setMeData(me);

    if (me.user.role === "ADMIN") {
      const [overview, users, schools, reviewers, config] = await Promise.all([
        fetch("/api/admin/overview",  { cache: "no-store" }),
        fetch("/api/admin/users",     { cache: "no-store" }),
        fetch("/api/admin/schools",   { cache: "no-store" }),
        fetch("/api/admin/reviewers", { cache: "no-store" }),
        fetch("/api/admin/config",    { cache: "no-store" }),
      ]);
      if (overview.ok)  setAdminData(((await overview.json())) as AdminOverview);
      if (users.ok)     setAdminUsers(((await users.json()) as { users: AdminUser[] }).users);
      if (schools.ok)   setAdminSchools(((await schools.json()) as { schools: AdminSchool[] }).schools);
      if (reviewers.ok) setAdminReviewers(((await reviewers.json()) as { reviewers: AdminReviewer[] }).reviewers);
      if (config.ok)    setAdminConfig(((await config.json()) as { config: AdminConfigShape }).config);
    }

    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadAll(); }, []);

  // Auto-clear toasts after a few seconds
  useEffect(() => {
    if (!message && !error) return;
    const id = setTimeout(() => { setMessage(null); setError(null); }, 3800);
    return () => clearTimeout(id);
  }, [message, error]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 48 }}>
        <div style={{ textAlign: "center" }}>
          <div className="plm-eyebrow">Loading</div>
          <div className="plm-display-3" style={{ fontSize: 24, marginTop: 8, color: "var(--ink-soft)" }}>
            Pulling your family in…
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {user.role === "PARENT" ? (
        <ParentDashboard
          user={user}
          meData={meData}
          reload={loadAll}
          setMessage={setMessage}
          setError={setError}
          onLogout={logout}
        />
      ) : null}

      {user.role === "CHILD" ? (
        <ChildDashboard
          user={user}
          meData={meData}
          reload={loadAll}
          setMessage={setMessage}
          setError={setError}
          onLogout={logout}
        />
      ) : null}

      {user.role === "ADMIN" ? (
        <AdminDashboard
          user={user}
          adminData={adminData}
          adminUsers={adminUsers}
          adminSchools={adminSchools}
          adminReviewers={adminReviewers}
          adminConfig={adminConfig}
          reload={loadAll}
          setMessage={setMessage}
          setError={setError}
          onLogout={logout}
        />
      ) : null}

      {message ? <Toast message={message} tone="success" /> : null}
      {error   ? <Toast message={error}   tone="error" /> : null}
    </>
  );
}
