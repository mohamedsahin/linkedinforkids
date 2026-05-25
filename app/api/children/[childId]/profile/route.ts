import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    const user = await requireUser();
    const { childId } = await context.params;

    if (user.role === UserRole.CHILD && user.id !== childId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    if (user.role === UserRole.PARENT) {
      const link = await prisma.parentChild.findFirst({
        where: { parentId: user.id, childId },
      });
      if (!link) {
        return NextResponse.json({ error: "Not allowed." }, { status: 403 });
      }
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.CHILD && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const body = await request.json();
    const data = profileUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: true, noChange: true });
    }

    const updated = await prisma.childProfile.update({
      where: { childId },
      data: updateData,
    });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please correct the highlighted fields." },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
  }
}
