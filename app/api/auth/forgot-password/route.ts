import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email." },
        { status: 404 },
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: "Account unavailable. Contact support." },
        { status: 403 },
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      // Invalidate any existing sessions for this user — force re-login everywhere.
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please fix the highlighted fields." },
        { status: 400 },
      );
    }
    console.error("Forgot-password failed", error);
    return NextResponse.json(
      { error: "Unable to reset password. Try again." },
      { status: 500 },
    );
  }
}
