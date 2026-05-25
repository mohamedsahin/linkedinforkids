"use client";

/* Shared types + helpers for dashboard views. */

export type Role = "PARENT" | "CHILD" | "ADMIN";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
};

export type ChildProfileData = {
  age: number;
  grade: string | null;
  school: string;
  bio: string;
  funFact: string | null;
  skills: string[];
  interests: string[];
  location: string | null;
  photoUrl: string | null;
  isPublic: boolean;
  requireApproval: boolean;
};

export type Achievement = {
  id: string;
  childId: string;
  title: string;
  category: string;
  description: string | null;
  proofUrl: string | null;
  proofFileUrl: string | null;
  proofHash?: string | null;
  isApproved: boolean;
  isFlagged?: boolean;
  createdAt: string;
  child?: { fullName: string };
};

export type ParentChildLink = {
  id: string;
  accessApproved: boolean;
  child: {
    id: string;
    fullName: string;
    email: string;
    childProfile: ChildProfileData | null;
    achievements: Achievement[];
    lastActiveAt?: string | null;
  };
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isSuspended: boolean;
  createdAt: string;
  childProfile: { isPublic: boolean; school: string; age: number } | null;
  _count: { achievements: number };
};

export type AdminOverview = {
  metrics: {
    users: number;
    families: number;
    children: number;
    achievements: number;
    pendingAchievements: number;
    flaggedAchievements: number;
    schools: number;
  };
  latency: { p50Ms: number; p95Ms: number; p99Ms: number; sample: number } | null;
  categoryBreakdown?: { category: string; count: number }[];
  weeklySeries?: { weekStart: string; achievements: number; approvals: number; newFamilies: number }[];
  retention?: { activePct: number; grid: number[][] };
  pending: Achievement[];
};

export type AdminSchool = {
  id: string;
  name: string;
  city: string | null;
  notes: string | null;
  status: "ACTIVE" | "PILOT" | "INACTIVE";
  familiesCount: number;
  childrenCount: number;
  createdAt: string;
};

export type AdminReviewer = {
  id: string;
  fullName: string;
  email: string;
  reviewerTitle: string;
  createdAt: string;
  weeklyReviews: number;
};

export type AdminConfigShape = {
  autoApproveParent: boolean;
  holdChildUploads: boolean;
  requireProof: boolean;
  csamHashCheck: boolean;
};

export type MeResponse = {
  user: User;
  parentData?: ParentChildLink[];
  childData?: {
    profile: ChildProfileData | null;
    achievements: Achievement[];
  };
};

export function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function lastActiveLabel(value: string | null | undefined) {
  if (!value) return "never signed in";
  try {
    return `last active ${relativeTime(value)}`;
  } catch {
    return "last active recently";
  }
}

export function relativeTime(value: string) {
  try {
    const diffMs = Date.now() - new Date(value).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(value);
  } catch {
    return value;
  }
}
