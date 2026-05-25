import { NextResponse } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";
import { randomBytes } from "crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { recordModerationEvent } from "@/lib/moderation";

const requestSchema = z.object({
  signerEmail: z.string().email(),
  signerTitle: z.string().max(80).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  note: z.string().max(400).optional().or(z.literal("")).transform((v) => (v ? v : null)),
});

/**
 * Parents (or admins) request a teacher / coach co-signature on an achievement.
 * We create a single-use signing token with a 30-day expiry. The teacher does
 * not need a Plume account — they redeem the token at /cosign/<token>.
 *
 * This powers the marketing promise of "School & coach co-signs".
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ achievementId: string }> },
) {
  try {
    const user = await requireUser();
    const { achievementId } = await context.params;
    const body = await request.json();
    const data = requestSchema.parse(body);

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { childId: true },
    });
    if (!achievement) return NextResponse.json({ error: "Achievement not found." }, { status: 404 });

    // Authorize: admin OR parent linked to this child
    if (user.role === UserRole.CHILD) {
      return NextResponse.json({ error: "Only a parent or admin can request a co-sign." }, { status: 403 });
    }
    if (user.role === UserRole.PARENT) {
      const link = await prisma.parentChild.findFirst({
        where: { parentId: user.id, childId: achievement.childId },
      });
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = randomBytes(24).toString("base64url");
    const cosign = await prisma.coSign.create({
      data: {
        achievementId,
        requestedBy: user.id,
        signerEmail: data.signerEmail,
        signerTitle: data.signerTitle,
        note: data.note,
        token,
        expiresAt: new Date(Date.now() + 30 * 86400_000),
      },
    });

    await recordModerationEvent({
      achievementId,
      reviewerId: user.id,
      decision: "COSIGN_REQUESTED",
      notes: `Sent to ${data.signerEmail}`,
    });

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      ok: true,
      cosign: { id: cosign.id, expiresAt: cosign.expiresAt },
      // The platform would normally email this; for the demo we surface it so
      // the parent can copy & share it with the teacher.
      verifyUrl: `${origin}/cosign/${token}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to send co-sign request." }, { status: 400 });
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ achievementId: string }> },
) {
  try {
    await requireUser();
    const { achievementId } = await context.params;
    const sigs = await prisma.coSign.findMany({
      where: { achievementId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, signerName: true, signerTitle: true, signerEmail: true,
        signedAt: true, expiresAt: true, createdAt: true, note: true,
      },
    });
    return NextResponse.json({ cosigns: sigs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
