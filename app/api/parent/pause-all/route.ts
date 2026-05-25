import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

/**
 * Flip accessApproved for every child linked to this parent. Used by the
 * "Pause all child accounts" + matching resume button in family settings.
 */
export async function POST(request: Request) {
  try {
    const parent = await requireRole([UserRole.PARENT]);
    const body = (await request.json().catch(() => ({}))) as { paused?: boolean };
    const paused = body.paused !== false; // default to pause

    const result = await prisma.parentChild.updateMany({
      where: { parentId: parent.id },
      data: { accessApproved: !paused },
    });

    if (paused) {
      // Sign every child out immediately.
      const links = await prisma.parentChild.findMany({
        where: { parentId: parent.id },
        select: { childId: true },
      });
      const ids = links.map((l) => l.childId);
      if (ids.length > 0) {
        await prisma.session.deleteMany({ where: { userId: { in: ids } } });
      }
    }

    return NextResponse.json({ ok: true, affected: result.count, paused });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("pause-all failed", error);
    return NextResponse.json({ error: "Unable to update child access." }, { status: 500 });
  }
}
