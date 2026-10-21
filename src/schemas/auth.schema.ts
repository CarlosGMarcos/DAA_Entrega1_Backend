/* ============================================================================
 * Auth request schemas (Zod)
 * Register never accepts a role: it is not in the schema, so a "role" sent
 * by the client is stripped and every new account is a plain user.
 * ========================================================================== */

import { z } from "zod";

const emailField = z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .email("email must be a valid email address");

export const registerSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "password is required" })
    .min(8, "password must have at least 8 characters")
    .max(72, "password cannot exceed 72 characters"),
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(2, "name must have at least 2 characters")
    .max(100, "name cannot exceed 100 characters"),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: "password is required" }).min(1, "password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
