import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Recrea la base de pruebas (test.db) y le aplica las migraciones antes de la corrida.
export const TEST_DATABASE_URL = "file:./test.db";

export default function setup() {
  for (const f of ["test.db", "test.db-journal", "test.db-wal", "test.db-shm"]) {
    rmSync(f, { force: true });
  }
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
