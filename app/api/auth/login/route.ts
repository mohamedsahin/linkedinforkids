import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import {
  getDatabaseUnavailableMessage,
  getFieldErrors,
  isDatabaseUnavailableError,
} from "@/lib/auth-errors";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Enforce the role tab the user selected on the login screen. We only
    // check AFTER verifying the password so we never reveal whether an email
    // exists — but if the password is right and the role is wrong, surface
    // a clear message.
    if (data.role && data.role !== user.role) {
      const friendly: Record<typeof user.role, string> = {
        PARENT: "Parent",
        CHILD:  "Child",
        ADMIN:  "Admin",
      };
      const label = friendly[user.role];
      const article = user.role === "ADMIN" ? "an" : "a";
      return NextResponse.json(
        { error: `This account is ${article} ${label} account. Use the ${label} tab to sign in.` },
        { status: 403 },
      );
    }

    if ((user as { isSuspended?: boolean }).isSuspended) {
      return NextResponse.json(
        { error: "This account has been suspended. Please contact support." },
        { status: 403 },
      );
    }

    if (user.role === UserRole.CHILD) {
      const link = await prisma.parentChild.findFirst({
        where: { childId: user.id },
      });

      if (!link || !link.accessApproved) {
        return NextResponse.json(
          {
            error: "Your parent has paused your access. Ask them to switch it back on.",
          },
          { status: 403 },
        );
      }
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Please correct the highlighted fields.",
          fieldErrors: getFieldErrors(error),
        },
        { status: 400 },
      );
    }

    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          error: getDatabaseUnavailableMessage(),
        },
        { status: 503 },
      );
    }

    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
