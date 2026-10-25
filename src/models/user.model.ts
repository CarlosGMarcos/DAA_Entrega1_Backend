/* ============================================================================
 * User model
 * The password hash is not loaded by default and is never included in a
 * response.
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
      // Remove the hash every time a user is sent in a response.
      transform: (_doc, ret) => {
        const { passwordHash: _passwordHash, ...publicUser } = ret;
        return publicUser;
      },
    },
  },
);

export const User = model<IUser>("User", userSchema);
