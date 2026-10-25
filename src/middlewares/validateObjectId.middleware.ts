/* ============================================================================
 * Id validation middleware
 * Answers 400 when an id is not a valid MongoDB id (e.g. /sensors/abc),
 * instead of letting Mongoose fail with a 500.
 * ========================================================================== */

import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const validateObjectId = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName] as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        error: "InvalidObjectId",
        message: `'${id}' is not a valid id (expected 24 hexadecimal characters).`,
      });
    }

    next();
  };
};
