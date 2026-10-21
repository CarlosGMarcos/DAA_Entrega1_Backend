/* ============================================================================
 * Auth helpers for integration tests
 * Registration can never create an admin, so tests create users with the
 * role they need straight in the database and sign a token for them with
 * the same tokenService the API uses.
 * ========================================================================== */

import bcrypt from "bcrypt";
import { User } from "../../src/models/user.model.js";
import { tokenService } from "../../src/services/token.service.js";
import type { UserRole } from "../../src/types/user.types.js";

export const createUserWithToken = async (role: UserRole) => {
  // Cost factor 4 (the minimum) keeps the tests fast; the API itself uses 10.
  const passwordHash = await bcrypt.hash("password123", 4);
  const user = await User.create({ email: `${role}@test.com`, passwordHash, name: `Test ${role}`, role });
  const token = tokenService.sign({ userId: user.id, email: user.email, role: user.role });
  return { user, token };
};

// Header object for supertest: request(app).get(url).set(bearer(token))
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
