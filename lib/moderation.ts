/**
 * Moderation audit + admin config helpers.
 *
 * Everything that touches the moderation queue funnels through here so that:
 *   • each decision is recorded on `ModerationEvent` with the reviewer + latency
 *   • the queue settings (auto-approve, hold child, require proof, CSAM hash)
 *     live in the database (`AdminConfig` singleton), not in localStorage
 *
 * Treat this file as the source of truth for "what the platform considers a
 * moderation action". The UI defers to it.
 */

import { ModerationDecision } from "@prisma/client";
import { prisma } from "./prisma";

const SINGLETON_ID = "singleton";

export type AdminConfigShape = {
  autoApproveParent: boolean;
  holdChildUploads: boolean;
  requireProof: boolean;
  csamHashCheck: boolean;
};

export async function getAdminConfig(): Promise<AdminConfigShape> {
  const row = await prisma.adminConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
  return {
    autoApproveParent: row.autoApproveParent,
    holdChildUploads:  row.holdChildUploads,
    requireProof:      row.requireProof,
    csamHashCheck:     row.csamHashCheck,
  };
}

export async function updateAdminConfig(patch: Partial<AdminConfigShape>): Promise<AdminConfigShape> {
  const row = await prisma.adminConfig.upsert({
    where: { id: SINGLETON_ID },
    update: patch,
    create: { id: SINGLETON_ID, ...patch },
  });
  return {
    autoApproveParent: row.autoApproveParent,
    holdChildUploads:  row.holdChildUploads,
    requireProof:      row.requireProof,
    csamHashCheck:     row.csamHashCheck,
  };
}

/**
 * Log a moderation decision against an achievement. Computes the latency
 * between the achievement being submitted and the action being taken so
 * the admin overview can show p50/p99 review times from real data.
 */
export async function recordModerationEvent(params: {
  achievementId: string;
  reviewerId: string;
  decision: ModerationDecision;
  notes?: string | null;
}) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: params.achievementId },
    select: { createdAt: true, title: true, category: true, childId: true },
  });
  const reviewMs = achievement
    ? Date.now() - achievement.createdAt.getTime()
    : null;

  return prisma.moderationEvent.create({
    data: {
      achievementId:       params.achievementId,
      achievementTitle:    achievement?.title ?? null,
      achievementCategory: achievement?.category ?? null,
      childId:             achievement?.childId ?? null,
      reviewerId:          params.reviewerId,
      decision:            params.decision,
      reviewMs:            reviewMs ?? undefined,
      notes:               params.notes ?? null,
    },
  });
}

/**
 * Pull p50 / p99 review latencies + reviewer counts from the audit log.
 * Returns null if there are no recorded events yet.
 */
export async function reviewLatencyStats(windowDays = 30) {
  const since = new Date(Date.now() - windowDays * 86400_000);
  const events = await prisma.moderationEvent.findMany({
    where: {
      createdAt: { gte: since },
      reviewMs: { not: null },
      decision: { in: ["APPROVED", "REJECTED"] },
    },
    select: { reviewMs: true },
    orderBy: { reviewMs: "asc" },
  });
  if (events.length === 0) return null;
  const xs = events.map((e) => e.reviewMs!).sort((a, b) => a - b);
  const p = (q: number) => xs[Math.min(xs.length - 1, Math.floor(xs.length * q))];
  return {
    sample: events.length,
    p50Ms: p(0.5),
    p95Ms: p(0.95),
    p99Ms: p(0.99),
  };
}

export function formatLatency(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
