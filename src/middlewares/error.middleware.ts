/* ============================================================================
 * Centralized error handling
 * Every error ends up here: thrown in a route, passed to next(err), or
 * rejected by an async handler (Express 5 forwards rejected promises on its
 * own). This is the only place that decides how an error looks to the client,
 * so all error responses share the same shape:
 *   { status: "fail" | "error", error, message, details? }
 * "fail" means the client sent something wrong (4xx); "error" means the
 * server failed (5xx).
 * ========================================================================== */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error.js";
import { env } from "../config/env.js";
import mongoose from "mongoose";

// Reached only when no router matched the request.
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: "fail",
    error: "RouteNotFound",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const globalErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // 1. Input that does not match a Zod schema (body, query or params).
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      error: "ValidationError",
      message: "The request data is not valid.",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  // 1.2 (specific case) A document rejected by a Mongoose model on save
  //      (e.g. a PATCH whose minThreshold is not lower than the maxThreshold already stored).
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      status: "fail",
      error: "ValidationError",
      message: "The request data is not valid.",
      details: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }
  // 1.3 A unique index was violated (e.g. two sign-ups with the same email at
  //     the same instant): MongoDB rejects the second one with code 11000.
  if ((err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? "value";
    return res.status(409).json({
      status: "fail",
      error: "DuplicateKey",
      message: `A resource with this ${field} already exists.`,
    });
  }

  // 2. Malformed JSON body: express.json() throws a SyntaxError. It is a client
  //    mistake, so it must not fall through to the generic 500 below.
  if (err instanceof SyntaxError && (err as SyntaxError & { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({
      status: "fail",
      error: "InvalidJSON",
      message: "The request body is not valid JSON.",
    });
  }

  // 3. Expected errors raised by the application, each with its own status code.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? "error" : "fail",
      error: err.name,
      message: err.message,
    });
  }

  // 4. Anything else is a bug: log it and hide the details from the client.
  console.error("Unhandled error:", err);

  return res.status(500).json({
    status: "error",
    error: "InternalServerError",
    message: "An unexpected error occurred on the server.",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
