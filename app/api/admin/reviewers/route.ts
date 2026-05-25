import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { ZodError } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";

const inviteSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  reviewerTitle: z.string().max(80).optional().or(z.literal("")).transform((v) => (v ? v : "Reviewer")),
});

export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    const reviewers = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isSuspended: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        reviewerTitle: true,
        createdAt: true,
      },
    });

    const since = new Date(Date.now() - 7 * 86400_000);
    const counts = await prisma.moderationEvent.groupBy({
      by: ["reviewerId"],
      where: { createdAt: { gte: since }, decision: { in: ["APPROVED", "REJECTED", "FLAGGED"] } },
      _count: { _all: true },
    });
    const countByReviewer = new Map(counts.map((c) => [c.reviewerId, c._count._all]));

    return NextResponse.json({
      reviewers: reviewers.map((r) => ({
        ...r,
        reviewerTitle: r.reviewerTitle ?? "Reviewer",
        weeklyReviews: countByReviewer.get(r.id) ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const data = inviteSchema.parse(body);

    const tempPassword = randomBytes(12).toString("base64url");

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: await hashPassword(tempPassword),
        role: UserRole.ADMIN,
        reviewerTitle: data.reviewerTitle,
      },
    });

    return NextResponse.json({
      ok: true,
      reviewer: { id: user.id, fullName: user.fullName, email: user.email, reviewerTitle: user.reviewerTitle },
      tempPassword,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email already has an account." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to invite reviewer." }, { status: 400 });
  }
}
