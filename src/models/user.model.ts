/* ============================================================================
 * User model (Mongoose)
 * How a user is stored in the "users" collection. The password hash is
 * protected twice: it is not loaded by default and never serialized to JSON.
 * ========================================================================== */

import { Schema, model } from "mongoose";
import { USER_ROLES, type IUser } from "../types/user.types.js";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: [true, "name is required"], trim: true, maxlength: 100 },
    role: { type: String, enum: USER_ROLES, default: "user" },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      // Strip the hash whenever a user is sent in a response.
      transform: (_doc, ret) => {
        const { passwordHash: _passwordHash, ...publicUser } = ret;
        return publicUser;
      },
    },
  },
);

export const User = model<IUser>("User", userSchema);
