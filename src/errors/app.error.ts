/* ============================================================================
 * Base class for operational errors
 * Operational errors are expected situations (invalid data, missing resource,
 * missing permissions) and carry their own HTTP status code. Anything that is
 * not an AppError is treated as an unexpected bug and answered with a 500.
 * Subclasses set `name`, which the error handler returns in the `error` field.
 * ========================================================================== */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Keep the prototype chain intact so `instanceof` works with subclasses.
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
