import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getAdminConfig, updateAdminConfig } from "@/lib/moderation";

const updateSchema = z.object({
  autoApproveParent: z.boolean().optional(),
  holdChildUploads: z.boolean().optional(),
  requireProof: z.boolean().optional(),
  csamHashCheck: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);
    const config = await getAdminConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const data = updateSchema.parse(body);
    const config = await updateAdminConfig(data);
    return NextResponse.json({ ok: true, config });
  } catch {
    return NextResponse.json({ error: "Unable to update settings." }, { status: 400 });
  }
}
