/* ============================================================================
 * Entry point
 * Starts the HTTP server. Importing env first guarantees the configuration is
 * valid before anything else runs.
 * ========================================================================== */

import { env } from "./config/env.js";
import { app } from "./app.js";

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
