import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { randomBytes } from "crypto";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isSuspended: true,
        twoFactorEnabled: true,
        reviewerTitle: true,
        createdAt: true,
        lastActiveAt: true,
        childProfile: {
          select: {
            isPublic: true,
            school: true,
            age: true,
          },
        },
        _count: {
          select: { achievements: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

const inviteAdminSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  reviewerTitle: z.string().max(80).optional().or(z.literal("")).transform((v) => (v ? v : "Admin")),
});

/**
 * Invite a new admin teammate. Creates the user with a strong random temp
 * password which the inviter forwards to the new admin out-of-band. They sign
 * in via the regular Login screen.
 */
export async function POST(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const data = inviteAdminSchema.parse(body);

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
      user: { id: user.id, fullName: user.fullName, email: user.email, reviewerTitle: user.reviewerTitle },
      tempPassword,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to invite admin." }, { status: 400 });
  }
}
