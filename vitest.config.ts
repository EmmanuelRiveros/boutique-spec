import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Base de pruebas aparte de dev.db; se recrea en cada corrida.
    globalSetup: ["tests/helpers/global-setup.ts"],
    env: { DATABASE_URL: "file:./test.db" },
    // Los archivos comparten test.db: se ejecutan uno tras otro.
    fileParallelism: false,
  },
});
