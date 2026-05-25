import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  /** Optional role gate. If present, the API will reject sign-ins where the
   *  user's actual role doesn't match what they picked on the role tab. */
  role: z.enum(["PARENT", "CHILD", "ADMIN"]).optional(),
});

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value));

export const childCreateSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  age: z.coerce.number().int().min(5).max(19),
  grade: optionalString(40),
  school: z.string().min(2).max(120),
  bio: z.string().min(8).max(300),
  funFact: optionalString(160),
  skills: z.array(z.string().min(1).max(40)).min(1).max(12),
  interests: z.array(z.string().min(1).max(40)).min(1).max(12),
  location: optionalString(80),
  photoUrl: optionalString(400),
});

export const profileUpdateSchema = z.object({
  age: z.coerce.number().int().min(5).max(19).optional(),
  grade: optionalString(40),
  school: z.string().min(2).max(120).optional(),
  bio: z.string().min(8).max(300).optional(),
  funFact: optionalString(160),
  skills: z.array(z.string().min(1).max(40)).min(1).max(12).optional(),
  interests: z.array(z.string().min(1).max(40)).min(1).max(12).optional(),
  location: optionalString(80),
  photoUrl: optionalString(400),
});

export const visibilitySchema = z.object({
  isPublic: z.boolean().optional(),
  accessApproved: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
});

export const achievementCreateSchema = z.object({
  childId: z.string().cuid().optional(),
  title: z.string().min(2).max(120),
  category: z.enum(["SPORTS", "ACADEMICS", "ARTS", "CODING", "MUSIC", "OTHER"]),
  description: optionalString(350),
  proofUrl: optionalString(300),
  proofFileUrl: optionalString(400),
  proofHash: optionalString(128),
});

export const achievementModerationSchema = z.object({
  isApproved: z.boolean().optional(),
  isFlagged: z.boolean().optional(),
  title: z.string().min(2).max(120).optional(),
  category: z.enum(["SPORTS", "ACADEMICS", "ARTS", "CODING", "MUSIC", "OTHER"]).optional(),
  description: optionalString(350),
  proofUrl: optionalString(300),
  proofFileUrl: optionalString(400),
  notes: optionalString(500),
});

export const meUpdateSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  phone: z
    .string()
    .max(40)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
});

export const userManagementSchema = z.object({
  isSuspended: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  reviewerTitle: z.string().max(80).optional().or(z.literal("")).transform((v) => (v ? v : null)),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
});
