import { NextResponse } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { recordModerationEvent } from "@/lib/moderation";

const submitSchema = z.object({
  signerName: z.string().min(2).max(80),
  signerTitle: z.string().max(80).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  note: z.string().max(400).optional().or(z.literal("")).transform((v) => (v ? v : null)),
});

/**
 * Public endpoint — no auth. The teacher / coach gets a single-use signed URL
 * by email; this resolves the token and returns the achievement so the form
 * can show "you're verifying X for Y". POST records the signature.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const cosign = await prisma.coSign.findUnique({
    where: { token },
    include: {
      achievement: {
        include: {
          child: { select: { fullName: true, childProfile: { select: { school: true, grade: true } } } },
        },
      },
    },
  });
  if (!cosign) return NextResponse.json({ error: "Link not found." }, { status: 404 });
  if (cosign.expiresAt < new Date()) return NextResponse.json({ error: "Link expired." }, { status: 410 });

  return NextResponse.json({
    cosign: {
      id: cosign.id,
      signerEmail: cosign.signerEmail,
      signedAt: cosign.signedAt,
      expiresAt: cosign.expiresAt,
      note: cosign.note,
    },
    achievement: cosign.achievement
      ? {
          id: cosign.achievement.id,
          title: cosign.achievement.title,
          description: cosign.achievement.description,
          category: cosign.achievement.category,
          createdAt: cosign.achievement.createdAt,
          child: {
            fullName: cosign.achievement.child.fullName,
            school: cosign.achievement.child.childProfile?.school ?? null,
            grade:  cosign.achievement.child.childProfile?.grade  ?? null,
          },
        }
      : null,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const data = submitSchema.parse(body);

    const cosign = await prisma.coSign.findUnique({
      where: { token },
      select: { id: true, achievementId: true, expiresAt: true, signedAt: true, requestedBy: true },
    });
    if (!cosign) return NextResponse.json({ error: "Link not found." }, { status: 404 });
    if (cosign.signedAt) return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
    if (cosign.expiresAt < new Date()) return NextResponse.json({ error: "Link expired." }, { status: 410 });
    if (!cosign.achievementId) return NextResponse.json({ error: "This achievement is no longer available." }, { status: 410 });

    const updated = await prisma.coSign.update({
      where: { id: cosign.id },
      data: {
        signerName: data.signerName,
        signerTitle: data.signerTitle,
        note: data.note ?? undefined,
        signedAt: new Date(),
      },
    });

    await recordModerationEvent({
      achievementId: cosign.achievementId,
      reviewerId: cosign.requestedBy,
      decision: "COSIGN_COMPLETED",
      notes: `Signed by ${data.signerName}${data.signerTitle ? ` (${data.signerTitle})` : ""}`,
    });

    return NextResponse.json({
      ok: true,
      signedAt: updated.signedAt,
      signerName: updated.signerName,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to record signature." }, { status: 400 });
  }
}
