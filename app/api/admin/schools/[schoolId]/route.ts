import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { schoolUpdateSchema } from "@/lib/school";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    await requireRole([UserRole.ADMIN]);
    const { schoolId } = await context.params;
    const body = await request.json();
    const data = schoolUpdateSchema.parse(body);

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.city !== undefined) update.city = data.city;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.status !== undefined) update.status = data.status;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, noChange: true });
    }

    const updated = await prisma.school.update({ where: { id: schoolId }, data: update });
    return NextResponse.json({ ok: true, school: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update school." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    await requireRole([UserRole.ADMIN]);
    const { schoolId } = await context.params;
    await prisma.school.delete({ where: { id: schoolId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete school." }, { status: 400 });
  }
}
