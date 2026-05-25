import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { schoolCreateSchema } from "@/lib/school";

export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    const schools = await prisma.school.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: {
        children: {
          select: {
            childId: true,
            child: { select: { fullName: true } },
          },
        },
      },
    });

    // Distinct parents per school (via ParentChild → childId).
    const childIdsBySchool = new Map<string, string[]>();
    for (const s of schools) childIdsBySchool.set(s.id, s.children.map((c) => c.childId));
    const allChildIds = schools.flatMap((s) => s.children.map((c) => c.childId));
    const parentLinks = allChildIds.length > 0
      ? await prisma.parentChild.findMany({
          where: { childId: { in: allChildIds } },
          select: { childId: true, parentId: true },
        })
      : [];
    const parentsByChild = new Map<string, Set<string>>();
    for (const link of parentLinks) {
      const set = parentsByChild.get(link.childId) ?? new Set();
      set.add(link.parentId);
      parentsByChild.set(link.childId, set);
    }

    const shaped = schools.map((s) => {
      const childIds = childIdsBySchool.get(s.id) ?? [];
      const parentSet = new Set<string>();
      for (const cid of childIds) {
        for (const pid of parentsByChild.get(cid) ?? []) parentSet.add(pid);
      }
      return {
        id: s.id,
        name: s.name,
        city: s.city,
        notes: s.notes,
        status: s.status,
        familiesCount: parentSet.size,
        childrenCount: childIds.length,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ schools: shaped });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const data = schoolCreateSchema.parse(body);

    const created = await prisma.school.create({
      data: {
        name: data.name,
        city: data.city ?? null,
        notes: data.notes ?? null,
        status: data.status,
      },
    });

    return NextResponse.json({ ok: true, school: created });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    const isUnique = (error as { code?: string })?.code === "P2002";
    if (isUnique) {
      return NextResponse.json({ error: "A school with that name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to add school." }, { status: 400 });
  }
}
