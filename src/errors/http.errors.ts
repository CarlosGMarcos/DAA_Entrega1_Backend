/* ============================================================================
 * HTTP errors raised by the services
 * Each subclass fixes its status code and its name; the global error handler
 * returns that name in the "error" field of the response.
 * ========================================================================== */

import { AppError } from "./app.error.js";

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFound";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "The request conflicts with the current state of the resource") {
    super(message, 409);
    this.name = "Conflict";
  }
}

// the service doesn't know anything about the HTTP
// But it can raise an specific errot type so the global error handler (error.middleware.ts)
// can return the correct status code and error name in the response.
