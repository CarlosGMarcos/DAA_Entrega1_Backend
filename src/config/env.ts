/* ============================================================================
 * Environment configuration
 * Validates the variables of .env with Zod. If one is missing or invalid, the
 * process stops at startup with a clear message.
 * ========================================================================== */

import { config } from "dotenv";
import { z } from "zod";

config({ quiet: true });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z
    .string({ required_error: "MONGODB_URI is required (e.g. mongodb://127.0.0.1:27017/garden_monitoring)" })
    .trim()
    .min(1, "MONGODB_URI cannot be empty"),
  JWT_SECRET: z.string({ required_error: "JWT_SECRET is required" }).min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().trim().min(1).default("8h"),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email("ADMIN_EMAIL must be a valid email").optional(),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters long").optional(),
  // Browser origins allowed by CORS, comma-separated (e.g. the Vue dev server).
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration (check your .env file against .env.example):");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
