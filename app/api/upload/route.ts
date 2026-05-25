import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/auth";
import { getAdminConfig } from "@/lib/moderation";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const PROOF_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export async function POST(request: Request) {
  try {
    await requireUser();

    const form = await request.formData();
    const file = form.get("file");
    const kindRaw = form.get("kind");
    const kind = typeof kindRaw === "string" ? kindRaw : "proof";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max size is 5 MB." },
        { status: 413 },
      );
    }

    const allowed = kind === "photo" ? IMAGE_TYPES : PROOF_TYPES;
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        {
          error:
            kind === "photo"
              ? "Photos must be PNG, JPG, WEBP, or GIF."
              : "Proof must be PNG, JPG, WEBP, GIF, or PDF.",
        },
        { status: 415 },
      );
    }

    const folder = kind === "photo" ? "photos" : "proofs";
    const filename = `${randomBytes(12).toString("hex")}${EXTENSIONS[file.type] ?? ""}`;
    const targetDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(targetDir, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());

    // Always compute the SHA-256 hash on receipt — used for dedupe and as the
    // hook for PhotoDNA / NCMEC Take-It-Down integrations. If the platform
    // setting `csamHashCheck` is on (default) and the same hash has already
    // been flagged on the platform, we reject the upload.
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (kind === "proof") {
      const config = await getAdminConfig();
      if (config.csamHashCheck) {
        // Future: query an external hash database. Locally, look for any
        // existing achievement with this hash already marked as flagged.
        const { prisma } = await import("@/lib/prisma");
        const flagged = await prisma.achievement.findFirst({
          where: { proofHash: sha256, isFlagged: true },
          select: { id: true },
        });
        if (flagged) {
          return NextResponse.json(
            { error: "This file has been flagged previously and can't be re-uploaded. Contact support if this is a mistake." },
            { status: 422 },
          );
        }
      }
    }

    await writeFile(path.join(targetDir, filename), bytes);

    const url = `/uploads/${folder}/${filename}`;
    return NextResponse.json({ ok: true, url, sha256 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Unable to upload file." }, { status: 500 });
  }
}
