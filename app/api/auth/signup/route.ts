import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import {
  getDatabaseUnavailableMessage,
  getFieldErrors,
  isDatabaseUnavailableError,
} from "@/lib/auth-errors";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = signupSchema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: UserRole.PARENT,
      },
    });

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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Email already exists.",
          fieldErrors: { email: "Email already exists." },
        },
        { status: 409 },
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

    console.error("Signup failed", error);
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
