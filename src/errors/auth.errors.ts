/* ============================================================================
 * Authentication and authorization errors
 * 401 = "I don't know who you are" (missing, invalid or expired token, or
 * wrong credentials). 403 = "I know who you are, but you can't do this".
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
