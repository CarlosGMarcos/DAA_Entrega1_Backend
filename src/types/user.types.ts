/* ============================================================================
 * User types
 * Roles and the data stored inside a token.
 * ========================================================================== */

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

// What travels inside the JWT: just enough to know who is calling and what
// they may do. A JWT is signed, not encrypted, so nothing secret goes here.
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}
