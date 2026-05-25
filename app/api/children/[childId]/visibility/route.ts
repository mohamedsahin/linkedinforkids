import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { visibilitySchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

/**
 * Partial-update endpoint for a child's privacy settings. Any subset of
 * { isPublic, accessApproved, requireApproval } can be sent. `accessApproved`
 * lives on ParentChild; the other two live on ChildProfile.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ childId: string }> },
) {
  try {
    const parent = await requireRole([UserRole.PARENT]);
    const { childId } = await context.params;
    const body = await request.json();
    const data = visibilitySchema.parse(body);

    const relation = await prisma.parentChild.findFirst({
      where: { parentId: parent.id, childId },
    });
    if (!relation) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const linkUpdate: Record<string, unknown> = {};
    if (data.accessApproved !== undefined) linkUpdate.accessApproved = data.accessApproved;

    const profileUpdate: Record<string, unknown> = {};
    if (data.isPublic !== undefined)        profileUpdate.isPublic = data.isPublic;
    if (data.requireApproval !== undefined) profileUpdate.requireApproval = data.requireApproval;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(linkUpdate).length > 0) {
        await tx.parentChild.update({ where: { id: relation.id }, data: linkUpdate });
      }
      if (Object.keys(profileUpdate).length > 0) {
        await tx.childProfile.update({ where: { childId }, data: profileUpdate });
      }
      if (linkUpdate.accessApproved === false) {
        // Suspending child access — sign them out everywhere.
        await tx.session.deleteMany({ where: { userId: childId } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update visibility." }, { status: 400 });
  }
}
