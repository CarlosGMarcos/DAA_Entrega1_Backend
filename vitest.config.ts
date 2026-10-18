import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
    // Tests never read the developer's .env: they get their own fixed values,
    // so `npm test` behaves the same on every machine and in CI.
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/garden_monitoring_test",
      JWT_SECRET: "test_secret_that_is_long_enough",
      JWT_EXPIRES_IN: "1h",
    },
  },
});
