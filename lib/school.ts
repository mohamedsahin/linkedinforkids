import { z } from "zod";

export const schoolCreateSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().max(80).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  notes: z.string().max(400).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  status: z.enum(["ACTIVE", "PILOT", "INACTIVE"]).optional().default("PILOT"),
});

export const schoolUpdateSchema = schoolCreateSchema.partial();

export type SchoolCreateInput = z.infer<typeof schoolCreateSchema>;
