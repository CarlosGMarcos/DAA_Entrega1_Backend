/* ============================================================================
 * Admin seed
 * On startup, creates the first administrator from ADMIN_EMAIL /
 * ADMIN_PASSWORD. If an admin already exists, it does nothing.
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
  // chose its password, so promoting it would give them admin permissions
  if (await User.exists({ email: env.ADMIN_EMAIL })) {
    console.warn(`[seed] ${env.ADMIN_EMAIL} is already used by a regular account: admin not created.`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await User.create({ email: env.ADMIN_EMAIL, passwordHash, name: "Administrator", role: "admin" });
  console.log(`[seed] Admin account created: ${env.ADMIN_EMAIL}`);
};
