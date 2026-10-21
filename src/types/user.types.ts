/* ============================================================================
 * User types
 * Single list of roles (used by the model, the JWT and the role middleware)
 * and the shape of the data carried inside an access token.
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
