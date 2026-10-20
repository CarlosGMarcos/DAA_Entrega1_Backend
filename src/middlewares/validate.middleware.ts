/* ============================================================================
 * Generic validation middleware
 * Parses req.body with the given Zod schema. On failure the ZodError goes to
 * next(), so the global error handler builds the 400 response.
 * ========================================================================== */

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
