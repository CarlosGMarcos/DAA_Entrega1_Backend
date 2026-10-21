/* ============================================================================
 * Authentication and role middlewares
 * authenticate answers "who are you?" (valid token, else 401).
 * authorize answers "may you do this?" (allowed role, else 403).
 * Neither responds itself: errors go to next() and the global error handler
 * builds the response.
 * ========================================================================== */

import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.service.js";
import type { AuthTokenPayload, UserRole } from "../types/user.types.js";
import { UnauthorizedError, InvalidTokenError, ForbiddenError } from "../errors/auth.errors.js";

// After authenticate runs, any handler can read req.user with full types.
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError());
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.user = tokenService.verify(token);
  } catch {
    // Wrong signature, tampered payload or expired token.
    return next(new InvalidTokenError());
  }

  next();
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
};
