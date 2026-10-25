/* ============================================================================
 * Base application error
 * Expected errors (invalid data, missing resource, missing permissions) carry
 * their own HTTP status. Any other error is answered with a 500.
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
