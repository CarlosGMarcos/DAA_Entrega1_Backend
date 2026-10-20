/* ============================================================================
 * MongoDB connection (Mongoose)
 * Wraps Mongoose so the rest of the app only calls connectDB/disconnectDB.
 * The URI comes from the validated env; the caller decides what to do on error.
 * ========================================================================== */

import mongoose from "mongoose";

export const connectDB = async (uri: string): Promise<void> => {
  // Fail after 10 s instead of the default 30 s if the cluster is unreachable.
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[db] Connected to MongoDB (database: ${mongoose.connection.name})`);
  } catch (error) {
    console.error("[db] Could not connect to MongoDB:", error);
    process.exit(1);
  }
};
// other option is to set the string inside the connect function:
//   const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/documind";
// then call:
//   await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
