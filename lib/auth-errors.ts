import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

type FieldErrors = Record<string, string>;

export function getFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001";
  }

  return error instanceof Error && error.message.includes("Can't reach database server");
}

export function getDatabaseUnavailableMessage() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return "Database unavailable. Check DATABASE_URL and start the configured database server.";
  }

  try {
    const parsed = new URL(databaseUrl);
    const port = parsed.port || "default port";
    return `Database unavailable. Start ${parsed.hostname}:${port} or update DATABASE_URL.`;
  } catch {
    return "Database unavailable. Check DATABASE_URL and start the configured database server.";
  }
}