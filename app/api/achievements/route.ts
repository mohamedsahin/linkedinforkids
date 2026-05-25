import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { achievementCreateSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getAdminConfig } from "@/lib/moderation";

export async function GET() {
  try {
    const user = await requireUser();

    if (user.role === UserRole.CHILD) {
      const achievements = await prisma.achievement.findMany({
        where: { childId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ achievements });
    }

    if (user.role === UserRole.PARENT) {
      const links = await prisma.parentChild.findMany({ where: { parentId: user.id } });
      const childIds = links.map((link) => link.childId);
      const achievements = await prisma.achievement.findMany({
        where: { childId: { in: childIds } },
        include: { child: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ achievements });
    }

    const achievements = await prisma.achievement.findMany({
      include: { child: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ achievements });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const data = achievementCreateSchema.parse(body);

    let targetChildId = user.id;

    if (user.role === UserRole.PARENT) {
      if (!data.childId) {
        return NextResponse.json({ error: "childId is required for parents." }, { status: 400 });
      }

      const relation = await prisma.parentChild.findFirst({
        where: {
          parentId: user.id,
          childId: data.childId,
        },
      });

      if (!relation) {
        return NextResponse.json({ error: "Not allowed." }, { status: 403 });
      }

      targetChildId = data.childId;
    }

    if (user.role === UserRole.ADMIN) {
      if (!data.childId) {
        return NextResponse.json({ error: "childId is required for admin." }, { status: 400 });
      }
      targetChildId = data.childId;
    }

    const config = await getAdminConfig();

    // Platform-level "require proof" gate.
    if (config.requireProof && !data.proofUrl && !data.proofFileUrl) {
      return NextResponse.json(
        { error: "Proof is required — attach a certificate, photo, or external link." },
        { status: 400 },
      );
    }

    let autoApprove: boolean;
    if (user.role === UserRole.PARENT) {
      autoApprove = config.autoApproveParent;
    } else if (user.role === UserRole.ADMIN) {
      autoApprove = true;
    } else {
      // Child upload — global policy wins, but per-child requireApproval can override
      // when the parent has explicitly relaxed it.
      autoApprove = !config.holdChildUploads;
      const profile = await prisma.childProfile.findUnique({
        where: { childId: targetChildId },
        select: { requireApproval: true },
      });
      if (profile && profile.requireApproval === false) {
        autoApprove = true;
      }
    }

    const created = await prisma.achievement.create({
      data: {
        childId: targetChildId,
        title: data.title,
        category: data.category,
        description: data.description ?? null,
        proofUrl: data.proofUrl ?? null,
        proofFileUrl: data.proofFileUrl ?? null,
        proofHash: data.proofHash ?? null,
        isApproved: autoApprove,
      },
    });

    return NextResponse.json({ ok: true, achievement: created });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to create achievement." }, { status: 400 });
  }
}
