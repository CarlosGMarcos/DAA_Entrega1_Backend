/* ============================================================================
 * Entry point
 * Connects to MongoDB, creates the first administrator if needed and starts
 * the HTTP server.
 * ========================================================================== */

import { env } from "./config/env.js";
import { app } from "./app.js";
import { connectDB } from "./config/database.js";
import { seedAdmin } from "./services/seed.service.js";

const bootstrap = async () => {
  // First: Try connection
  try {
    await connectDB(env.MONGODB_URI);
  } catch (error) {
    console.error("[db] Could not connect to MongoDB:", (error as Error).message);
    process.exit(1);
  }

  // Second: Seed admin if needed
  await seedAdmin();
  // Creates an admin from ADMIN_EMAIL / ADMIN_PASSWORD only if none exists yet.
  // Changing those values later does not modify the existing admin

  // Third: Start listening for requests
  const server = app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`[server] API docs at http://localhost:${env.PORT}/api/docs`);
  });

  // Handle errors that occur while starting the server (e.g. port already in use).
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[server] Port ${env.PORT} is already in use. Change PORT in your .env file.`);
    } else {
      console.error("[server] Could not start:", error);
    }
    process.exit(1);
  });
};

bootstrap();
