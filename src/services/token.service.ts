/* ============================================================================
 * Token service (JWT)
 * Signs access tokens with JWT_SECRET and verifies them. A JWT is
 * header.payload.signature: changing the payload (e.g. the role) breaks the
 * signature, so verify() rejects it.
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
