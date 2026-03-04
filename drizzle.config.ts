import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "db.sqlite",
  },
  tablesFilter: ["trellis_*"],
} satisfies Config;
