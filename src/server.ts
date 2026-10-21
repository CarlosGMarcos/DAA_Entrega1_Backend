/* ============================================================================
 * Entry point
 * Starts the HTTP server. Importing env first guarantees the configuration is
 * valid before anything else runs.
 * ========================================================================== */

import { env } from "./config/env.js";
import { app } from "./app.js";
import { connectDB } from "./config/database.js";
import { seedAdmin } from "./services/seed.service.js";

const bootstrap = async () => {
  // Firt: Try connection
  try {
    await connectDB(env.MONGODB_URI);
  } catch (error) {
    console.error("[db] Could not connect to MongoDB:", (error as Error).message);
    process.exit(1);
  }

  // Second: Seed admin if needed
  await seedAdmin();
  // Sets an admin account if none exists.
  // If you start the server without one, it will create one from ADMIN_EMAIL / ADMIN_PASSWORD.
  // If you change those values, the server will not update the existing admin account:
  // it only creates one if none exists.

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
