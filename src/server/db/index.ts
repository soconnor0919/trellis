import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "path";

import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
  db: Db | undefined;
};

function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;

  // Use || not ?? so empty-string DATABASE_URL (e.g. Coolify build arg) falls back to default
  const raw = process.env.DATABASE_URL || path.join(process.cwd(), "db.sqlite");
  // Strip file: URI prefix that some platforms inject (e.g. Coolify build args)
  const dbPath = raw.startsWith("file:") ? raw.slice(5) : raw;

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.sqlite = sqlite;
    globalForDb.db = db;
  }
  return db;
}

// Lazy proxy: importing this module never opens the DB file.
// The connection is established on first actual query (at request time, not build time).
export const db = new Proxy({} as Db, {
  get(_, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
