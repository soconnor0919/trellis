import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { contactSubmissions } from "~/server/db/schema";
import { sendContactNotification } from "~/lib/email";

export const contactRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        email: z.string().email().max(256),
        subject: z.string().max(512).optional(),
        message: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(contactSubmissions).values(input);
      // Fire-and-forget — never blocks the response or surfaces SMTP errors to the visitor
      void sendContactNotification(input).catch(console.error);
    }),

  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.db
        .update(contactSubmissions)
        .set({ read: true })
        .where(eq(contactSubmissions.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.db
        .delete(contactSubmissions)
        .where(eq(contactSubmissions.id, input.id));
    }),
});
