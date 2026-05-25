import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { deleteCurrentSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meUpdateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();

    // Refresh "last active" on every authenticated /me call.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => null);

    if (user.role === UserRole.PARENT) {
      const inbox = await prisma.message.findMany({
        where: { toUserId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { fromUser: { select: { id: true, fullName: true, role: true } } },
      });

      const children = await prisma.parentChild.findMany({
        where: { parentId: user.id },
        include: {
          child: {
            include: {
              childProfile: true,
              achievements: {
                orderBy: { createdAt: "desc" },
              },
              sessions: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { createdAt: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Flatten sessions → lastActiveAt so the client doesn't need to know
      // about the session join.
      const shaped = children.map((c) => ({
        ...c,
        child: {
          ...c.child,
          lastActiveAt: c.child.sessions[0]?.createdAt ?? null,
          sessions: undefined,
        },
      }));

      return NextResponse.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: (user as { phone?: string | null }).phone ?? null,
          role: user.role,
        },
        parentData: shaped,
        inbox: inbox.map((m) => ({
          id: m.id,
          subject: m.subject,
          body: m.body,
          readAt: m.readAt,
          createdAt: m.createdAt,
          from: m.fromUser,
        })),
      });
    }

    if (user.role === UserRole.CHILD) {
      const profile = await prisma.childProfile.findUnique({ where: { childId: user.id } });
      const achievements = await prisma.achievement.findMany({
        where: { childId: user.id },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: (user as { phone?: string | null }).phone ?? null,
          role: user.role,
        },
        childData: { profile, achievements },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: (user as { phone?: string | null }).phone ?? null,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const data = meUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: true, noChange: true });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: (updated as { phone?: string | null }).phone ?? null,
        role: updated.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();

    if (user.role === UserRole.PARENT) {
      // Wipe the whole family: linked children's user rows (achievements + childProfile
      // cascade via FK), then the parent. ParentChild rows cascade with either side.
      const links = await prisma.parentChild.findMany({
        where: { parentId: user.id },
        select: { childId: true },
      });
      const childIds = links.map((l) => l.childId);

      await prisma.$transaction(async (tx) => {
        if (childIds.length > 0) {
          await tx.user.deleteMany({ where: { id: { in: childIds } } });
        }
        await tx.user.delete({ where: { id: user.id } });
      });
    } else {
      // Children and admins delete only themselves.
      await prisma.user.delete({ where: { id: user.id } });
    }

    await deleteCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Account delete failed", error);
    return NextResponse.json({ error: "Unable to delete account." }, { status: 500 });
  }
}
