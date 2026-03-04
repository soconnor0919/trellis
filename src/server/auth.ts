import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { auditLog } from "~/server/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Find the user's email for the log entry
          const u = db.select({ email: schema.user.email }).from(schema.user).where(
            (await import("drizzle-orm")).eq(schema.user.id, session.userId)
          ).get();
          await db.insert(auditLog).values({
            userId:    session.userId,
            userEmail: u?.email,
            action:    "auth.login",
            entity:    "session",
            detail:    u?.email ? `Signed in as ${u.email}` : "Session created",
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
