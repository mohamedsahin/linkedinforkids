import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    await requireRole([UserRole.ADMIN]);
    const { schoolId } = await context.params;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        children: {
          include: {
            child: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isSuspended: true,
                createdAt: true,
                _count: { select: { achievements: true } },
              },
            },
          },
          orderBy: { child: { fullName: "asc" } },
        },
      },
    });
    if (!school) return NextResponse.json({ error: "Not found." }, { status: 404 });

    return NextResponse.json({
      school: { id: school.id, name: school.name, status: school.status, city: school.city },
      roster: school.children.map((p) => ({
        id: p.child.id,
        fullName: p.child.fullName,
        email: p.child.email,
        grade: p.grade,
        age: p.age,
        isSuspended: p.child.isSuspended,
        joinedAt: p.child.createdAt,
        achievementCount: p.child._count.achievements,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
