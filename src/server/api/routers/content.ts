import { z } from "zod";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { pageContent } from "~/server/db/schema";

const pageKeyInput = z.object({ page: z.string(), key: z.string(), value: z.string() });

export const contentRouter = createTRPCRouter({
  // Returns all columns including draftValue. Public pages resolve which to display.
  getPage: publicProcedure
    .input(z.object({ page: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(pageContent)
        .where(eq(pageContent.page, input.page));
    }),

  // Legacy direct-publish — kept for back-compat but no longer called by the editor UI.
  set: protectedProcedure
    .input(pageKeyInput)
    .mutation(async ({ ctx, input }) => {
      const existing = ctx.db
        .select()
        .from(pageContent)
        .where(and(eq(pageContent.page, input.page), eq(pageContent.key, input.key)))
        .get();
      if (existing) {
        return ctx.db
          .update(pageContent)
          .set({ value: input.value })
          .where(and(eq(pageContent.page, input.page), eq(pageContent.key, input.key)));
      }
      return ctx.db.insert(pageContent).values(input);
    }),

  // Auto-save a single field's draft (called debounced on every keystroke).
  // Does NOT touch `value` — only writes `draftValue`.
  setDraft: protectedProcedure
    .input(pageKeyInput)
    .mutation(async ({ ctx, input }) => {
      const existing = ctx.db
        .select()
        .from(pageContent)
        .where(and(eq(pageContent.page, input.page), eq(pageContent.key, input.key)))
        .get();
      if (existing) {
        return ctx.db
          .update(pageContent)
          .set({ draftValue: input.value })
          .where(and(eq(pageContent.page, input.page), eq(pageContent.key, input.key)));
      }
      // Row doesn't exist yet — create it with an empty live value; publish will fill it.
      return ctx.db.insert(pageContent).values({
        page: input.page,
        key: input.key,
        value: "",
        draftValue: input.value,
      });
    }),

  // Publish: copy draftValue → value for every field that has a pending draft.
  publish: protectedProcedure
    .input(z.object({ page: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db
        .update(pageContent)
        .set({
          value: sql`${pageContent.draftValue}`,
          draftValue: null,
        })
        .where(and(eq(pageContent.page, input.page), isNotNull(pageContent.draftValue)));
    }),

  // Discard: clear draftValue for all fields on a page.
  discardDraft: protectedProcedure
    .input(z.object({ page: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db
        .update(pageContent)
        .set({ draftValue: null })
        .where(eq(pageContent.page, input.page));
    }),
});
