import { NextResponse } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const sendSchema = z.object({
  achievementId: z.string().cuid().optional(),
  toUserId: z.string().cuid().optional(),
  subject: z.string().min(2).max(140),
  body: z.string().min(2).max(2000),
});

export async function POST(request: Request) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const data = sendSchema.parse(body);

    // Resolve the recipient. Prefer the parent linked to the achievement's child,
    // otherwise honour an explicit toUserId.
    let toUserId = data.toUserId ?? null;
    if (data.achievementId && !toUserId) {
      const achievement = await prisma.achievement.findUnique({
        where: { id: data.achievementId },
        select: { childId: true },
      });
      if (achievement) {
        const link = await prisma.parentChild.findFirst({
          where: { childId: achievement.childId },
          select: { parentId: true },
        });
        toUserId = link?.parentId ?? null;
      }
    }
    if (!toUserId) {
      return NextResponse.json({ error: "Couldn't resolve a recipient family for this message." }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: admin.id,
        toUserId,
        subject: data.subject,
        body: data.body,
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please correct the highlighted fields." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to send message." }, { status: 400 });
  }
}
