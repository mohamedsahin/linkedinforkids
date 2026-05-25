import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ModerationDecision, UserRole } from "@prisma/client";
import { achievementModerationSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { recordModerationEvent } from "@/lib/moderation";

/**
 * Moderation + edit endpoint. Admins can update any achievement; parents can
 * update achievements belonging to their own children (so the parent dashboard's
 * Review queue and the "Edit first" flow both work without admin powers).
 *
 * Every successful PATCH / DELETE produces a `ModerationEvent` row so the
 * audit log + admin Overview latencies are real.
 */
async function authorize(achievementId: string) {
  const user = await requireUser();

  if (user.role === UserRole.ADMIN) return user;

  if (user.role === UserRole.PARENT) {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { childId: true },
    });
    if (!achievement) return null;
    const link = await prisma.parentChild.findFirst({
      where: { parentId: user.id, childId: achievement.childId },
    });
    if (!link) return null;
    return user;
  }

  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ achievementId: string }> },
) {
  try {
    const { achievementId } = await context.params;
    const allowed = await authorize(achievementId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = achievementModerationSchema.parse(body);

    const previous = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { isApproved: true, isFlagged: true },
    });

    const updateData: Record<string, unknown> = {};
    if (data.isApproved !== undefined)   updateData.isApproved   = data.isApproved;
    if (data.title       !== undefined)  updateData.title        = data.title;
    if (data.category    !== undefined)  updateData.category     = data.category;
    if (data.description !== undefined)  updateData.description  = data.description ?? null;
    if (data.proofUrl    !== undefined)  updateData.proofUrl     = data.proofUrl ?? null;
    if (data.proofFileUrl !== undefined) updateData.proofFileUrl = data.proofFileUrl ?? null;
    if (data.isFlagged   !== undefined)  updateData.isFlagged    = data.isFlagged;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: true, noChange: true });
    }

    const updated = await prisma.achievement.update({
      where: { id: achievementId },
      data: updateData,
    });

    // Decide what kind of audit event(s) to record.
    const events: ModerationDecision[] = [];
    if (data.isApproved !== undefined && data.isApproved !== previous?.isApproved) {
      events.push(data.isApproved ? "APPROVED" : "PENDING");
    }
    if (data.isFlagged !== undefined && data.isFlagged !== previous?.isFlagged) {
      events.push(data.isFlagged ? "FLAGGED" : "UNFLAGGED");
    }
    if (events.length === 0 && (data.title || data.category || data.description !== undefined || data.proofUrl !== undefined || data.proofFileUrl !== undefined)) {
      events.push("EDITED");
    }
    for (const decision of events) {
      await recordModerationEvent({
        achievementId,
        reviewerId: allowed.id,
        decision,
        notes: data.notes ?? null,
      });
    }

    return NextResponse.json({ ok: true, achievement: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please fix the highlighted fields." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to moderate achievement." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ achievementId: string }> },
) {
  try {
    const { achievementId } = await context.params;
    const allowed = await authorize(achievementId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Record the rejection BEFORE delete so the audit row survives the cascade.
    await recordModerationEvent({
      achievementId,
      reviewerId: allowed.id,
      decision: "REJECTED",
    }).catch(() => null);

    await prisma.achievement.delete({ where: { id: achievementId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete achievement." }, { status: 400 });
  }
}
