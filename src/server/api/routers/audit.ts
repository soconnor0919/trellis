import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "~/server/api/trpc";
import { auditLog } from "~/server/db/schema";

export const auditRouter = createTRPCRouter({
  /** Fetch recent audit log entries — admins/editors only */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit)
        .all();
    }),

  /** Write an audit entry (called from other mutations) */
  log: protectedProcedure
    .input(z.object({
      action: z.string(),
      entity: z.string().optional(),
      detail: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    input.action,
        entity:    input.entity,
        detail:    input.detail,
      });
    }),

  /** Clear all audit entries — admin only */
  clear: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(auditLog).run();
  }),
});
