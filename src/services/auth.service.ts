/* ============================================================================
 * Auth service
 * Register hashes the password with bcrypt and always creates a plain user.
 * Login answers the same 401 whether the email or the password is wrong.
 * ========================================================================== */

import bcrypt from "bcrypt";
import type { HydratedDocument } from "mongoose";
import { User } from "../models/user.model.js";
import { tokenService } from "./token.service.js";
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from "../errors/auth.errors.js";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";
import type { IUser } from "../types/user.types.js";

// bcrypt cost factor: 2^10 rounds, slow on purpose against brute force.
const SALT_ROUNDS = 10;

export class AuthService {
  async register({ email, password, name }: RegisterInput) {
    if (await User.exists({ email })) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, name });
    return this.buildAuthResult(user);
  }

  async login({ email, password }: LoginInput) {
    // The hash is not loaded by default (select: false), so ask for it here.
    const user = await User.findOne({ email }).select("+passwordHash").exec();
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return this.buildAuthResult(user);
  }

  // login and register return the same shape: a JWT and the user object (without the hash).
  private buildAuthResult(user: HydratedDocument<IUser>) {
    const token = tokenService.sign({ userId: user.id, email: user.email, role: user.role });
    return { token, user };
  }
}

export const authService = new AuthService();
