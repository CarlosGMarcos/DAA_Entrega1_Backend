/* ============================================================================
 * HTTP errors raised by the services
 * Each class sets its status code and the name returned in the "error" field.
 * ========================================================================== */

// The service doesn't know anything about the HTTP
// But it can raise a specific errot type so the global error handler (error.middleware.ts)
// can return the correct status code and error name in the response.

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

export class UnitMismatchError extends AppError {
  constructor(sent: string, expected: string) {
    super(`Unit '${sent}' does not match the sensor unit '${expected}'`, 400);
    this.name = "UnitMismatch";
  }
}
