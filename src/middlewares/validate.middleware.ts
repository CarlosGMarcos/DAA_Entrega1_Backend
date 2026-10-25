/* ============================================================================
 * Validation middlewares
 * Check the body or the query string with a Zod schema. If the data is not
 * valid, the error goes to the global error handler, which answers 400.
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

// Same idea for the query string.
// In Express 5, req.query cannot be replaced:
//      the assignment is ignored without any error.
// That is why the parsed values are set with Object.defineProperty.
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
