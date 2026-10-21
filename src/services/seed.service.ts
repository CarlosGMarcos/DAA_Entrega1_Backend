/* ============================================================================
 * Admin seed
 * Registration always creates plain users, so the first admin is created
 * here on startup from ADMIN_EMAIL / ADMIN_PASSWORD. Idempotent: running it
 * again (every restart) changes nothing once an admin exists.
 * ========================================================================== */

import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

export const seedAdmin = async (): Promise<void> => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn("[seed] ADMIN_EMAIL or ADMIN_PASSWORD not set: no admin account created.");
    return;
  }

  if (await User.exists({ role: "admin" })) {
    console.log("[seed] An admin already exists: nothing to do.");
    return;
  }

  // Never promote an existing account: whoever registered with that email
  // chose its password, so promoting it would hand them admin rights.
  if (await User.exists({ email: env.ADMIN_EMAIL })) {
    console.warn(`[seed] ${env.ADMIN_EMAIL} is already used by a regular account: admin not created.`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await User.create({ email: env.ADMIN_EMAIL, passwordHash, name: "Administrator", role: "admin" });
  console.log(`[seed] Admin account created: ${env.ADMIN_EMAIL}`);
};
