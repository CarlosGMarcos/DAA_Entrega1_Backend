/* ============================================================================
 * MongoDB connection (Mongoose)
 * Wraps Mongoose so the rest of the app only calls connectDB/disconnectDB.
 * The URI comes from the validated env; the caller decides what to do on error.
 * ========================================================================== */

import mongoose from "mongoose";

export const connectDB = async (uri: string): Promise<void> => {
  // Fail after 10 s instead of the default 30 s if the cluster is unreachable.
  // There's no need to try{} catch{}, here, the caller will handle the error and exit the process if needed.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] Connected to MongoDB (database: ${mongoose.connection.name})`);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
