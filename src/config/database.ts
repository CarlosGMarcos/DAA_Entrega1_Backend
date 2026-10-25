/* ============================================================================
 * MongoDB connection
 * Connects and disconnects Mongoose. Errors are handled by the caller.
 * ========================================================================== */

import mongoose from "mongoose";

export const connectDB = async (uri: string): Promise<void> => {
  // Fail after 10 s instead of the default 30 s if the cluster is unreachable.
  // There's no need for try/catch here: the caller handles the error and exits the process if needed.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] Connected to MongoDB (database: ${mongoose.connection.name})`);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
