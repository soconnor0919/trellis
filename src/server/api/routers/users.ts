import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { user, userProfile, auditLog } from "~/server/db/schema";
import { auth } from "~/server/auth";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
  getAll: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db
      .select({
        id:        user.id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
        role:      userProfile.role,
      })
      .from(user)
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .all();

    return users.map((u) => ({ ...u, role: u.role ?? "viewer" as const }));
  }),

  invite: adminProcedure
    .input(z.object({
      name:     z.string().min(1),
      email:    z.string().email(),
      password: z.string().min(8),
      role:     z.enum(["admin", "editor", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await auth.api.signUpEmail({
        body: { name: input.name, email: input.email, password: input.password },
        headers: new Headers(),
      }).catch(() => null);

      if (!result?.user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Could not create user — email may already exist" });
      }

      await ctx.db
        .insert(userProfile)
        .values({ userId: result.user.id, role: input.role })
        .onConflictDoUpdate({ target: userProfile.userId, set: { role: input.role } })
        .run();

      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "users.invite",
        entity:    "user",
        detail:    `${input.name} <${input.email}> as ${input.role}`,
      });

      return { id: result.user.id };
    }),

  updateRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role:   z.enum(["admin", "editor", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userProfile)
        .values({ userId: input.userId, role: input.role })
        .onConflictDoUpdate({ target: userProfile.userId, set: { role: input.role } })
        .run();

      // Get target user email for the log
      const target = await ctx.db.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, input.userId)).get();
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "users.updateRole",
        entity:    "user",
        detail:    `${target?.name ?? input.userId} → ${input.role}`,
      });
    }),

  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
      }
      const target = await ctx.db.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, input.userId)).get();
      await ctx.db.delete(user).where(eq(user.id, input.userId)).run();
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "users.delete",
        entity:    "user",
        detail:    target?.email ?? input.userId,
      });
    }),
});
