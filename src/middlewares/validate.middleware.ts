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

// Same idea for the query string. In Express 5 req.query is a read-only
// getter: "req.query = schema.parse(req.query)" is silently ignored, so the
// parsed values are attached with Object.defineProperty (as in example 09).
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, "query", { value: parsed, writable: true, enumerable: true, configurable: true });
      next();
    } catch (error) {
      next(error);
    }
  };
};
