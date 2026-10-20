/* ============================================================================
 * In-memory MongoDB for integration tests
 * Each test file that needs a database starts its own throwaway MongoDB, so
 * tests never touch Atlas or the developer's data and always start clean.
 * ========================================================================== */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB, disconnectDB } from "../../src/config/database.js";

let mongoServer: MongoMemoryServer | undefined;

export const startTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
};

// Empties every collection so each test starts from a known state.
export const clearTestDB = async (): Promise<void> => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

export const stopTestDB = async (): Promise<void> => {
  await disconnectDB();
  await mongoServer?.stop();
};
