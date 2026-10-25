/* ============================================================================
 * Authentication and authorization errors
 * 401: the user is not identified (no token, invalid token or wrong
 * credentials). 403: the user is identified but lacks permission.
 * ========================================================================== */

import { AppError } from "./app.error.js";

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required: send the header 'Authorization: Bearer <token>'") {
    super(message, 401);
    this.name = "Unauthorized";
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super("The token is invalid or has expired", 401);
    this.name = "InvalidToken";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid email or password", 401);
    this.name = "InvalidCredentials";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Your role does not allow this action") {
    super(message, 403);
    this.name = "Forbidden";
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  constructor() {
    super("This email is already registered", 409);
    this.name = "EmailAlreadyRegistered";
  }
}
