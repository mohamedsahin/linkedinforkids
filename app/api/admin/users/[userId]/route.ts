import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { userManagementSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const { userId } = await context.params;

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Cannot modify your own admin account here." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data = userManagementSchema.parse(body);

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (data.isSuspended !== undefined)       update.isSuspended       = data.isSuspended;
    if (data.twoFactorEnabled !== undefined)  update.twoFactorEnabled  = data.twoFactorEnabled;
    if (data.reviewerTitle !== undefined)     update.reviewerTitle     = data.reviewerTitle;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, noChange: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: update });
      if (data.isSuspended) {
        await tx.session.deleteMany({ where: { userId } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update user." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const { userId } = await context.params;

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account." },
        { status: 400 },
      );
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete user." }, { status: 400 });
  }
}
