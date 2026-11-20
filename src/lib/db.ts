import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

// Un solo adaptador para ambos entornos:
// - Local:   DATABASE_URL="file:./dev.db"        (SQLite en archivo)
// - Entrega: DATABASE_URL="libsql://<db>.turso.io" + DATABASE_AUTH_TOKEN (Turso)
function createClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
