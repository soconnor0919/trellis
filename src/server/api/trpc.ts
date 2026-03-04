import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { userProfile } from "~/server/db/schema";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return {
    db,
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms`);
  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: ctx.session } });
});

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceAuth);

// Fetch role from userProfile table
const getRole = async (userId: string) => {
  const profile = await db
    .select({ role: userProfile.role })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .get();
  return profile?.role ?? "viewer";
};

const enforceEditor = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const role = await getRole(ctx.session.user.id);
  if (role !== "admin" && role !== "editor") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { session: ctx.session, role } });
});

const enforceAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const role = await getRole(ctx.session.user.id);
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { session: ctx.session, role } });
});

export const editorProcedure = t.procedure.use(timingMiddleware).use(enforceEditor);
export const adminProcedure  = t.procedure.use(timingMiddleware).use(enforceAdmin);
