import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { childCreateSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const parent = await requireRole([UserRole.PARENT]);
    const body = await request.json();
    const data = childCreateSchema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: "Child email already exists." }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const child = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          passwordHash: await hashPassword(data.password),
          role: UserRole.CHILD,
        },
      });

      await tx.parentChild.create({
        data: {
          parentId: parent.id,
          childId: child.id,
          accessApproved: true,
        },
      });

      await tx.childProfile.create({
        data: {
          childId: child.id,
          age: data.age,
          grade: data.grade ?? null,
          school: data.school,
          bio: data.bio,
          funFact: data.funFact ?? null,
          skills: data.skills,
          interests: data.interests,
          location: data.location ?? null,
          photoUrl: data.photoUrl ?? null,
          isPublic: false,
        } as never,
      });

      return child;
    });

    return NextResponse.json({ ok: true, childId: result.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields." },
        { status: 400 },
      );
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Child create failed", error);
    return NextResponse.json({ error: "Unable to create child profile." }, { status: 400 });
  }
}
