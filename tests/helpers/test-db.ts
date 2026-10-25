/* ============================================================================
 * In-memory MongoDB for tests
 * Each test file uses its own temporary database, so tests never touch real
 * data and always start clean.
 * ========================================================================== */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB, disconnectDB } from "../../src/config/database.js";

let mongoServer: MongoMemoryServer | undefined;

export const startTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
};

export const clearTestDB = async (): Promise<void> => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

export const stopTestDB = async (): Promise<void> => {
  await disconnectDB();
  await mongoServer?.stop();
};
