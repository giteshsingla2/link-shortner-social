import "server-only";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 10,
    // Store and read all times as UTC so charts line up regardless of server timezone.
    timezone: "Z",
  });
  // `timezone` above only affects how the driver converts dates. MySQL itself also
  // needs to work in UTC, or DEFAULT CURRENT_TIMESTAMP and NOW() use the server's
  // local time. This runs first on every new connection, before any app query.
  pool.pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  return pool;
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
