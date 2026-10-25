/* ============================================================================
 * Token service (JWT)
 * Signs and verifies tokens with JWT_SECRET. If the content of a token is
 * modified, its signature no longer matches and verification fails.
 * ========================================================================== */

import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthTokenPayload } from "../types/user.types.js";

export class TokenService {
  sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });
  }

  // Throws if the token was tampered with or has expired.
  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  }
}

export const tokenService = new TokenService();
