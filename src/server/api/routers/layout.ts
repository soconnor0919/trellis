import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, editorProcedure } from "~/server/api/trpc";
import { pageLayout, auditLog } from "~/server/db/schema";
import type { Block } from "~/lib/blocks";

export const layoutRouter = createTRPCRouter({
  getPage: publicProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = ctx.db
        .select()
        .from(pageLayout)
        .where(eq(pageLayout.page, input.page))
        .get();
      return {
        layout:      (row ? JSON.parse(row.layout) : []) as Block[],
        draftLayout: row?.draftLayout ? (JSON.parse(row.draftLayout) as Block[]) : null,
      };
    }),

  saveDraft: editorProcedure
    .input(z.object({ page: z.string(), blocks: z.array(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const json = JSON.stringify(input.blocks);
      const existing = ctx.db
        .select()
        .from(pageLayout)
        .where(eq(pageLayout.page, input.page))
        .get();
      if (existing) {
        await ctx.db
          .update(pageLayout)
          .set({ draftLayout: json })
          .where(eq(pageLayout.page, input.page));
      } else {
        await ctx.db.insert(pageLayout).values({ page: input.page, layout: "[]", draftLayout: json });
      }
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "content.save",
        entity:    `page:${input.page}`,
        detail:    `Saved draft for ${input.page}`,
      });
    }),

  publish: editorProcedure
    .input(z.object({ page: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(pageLayout)
        .set({ layout: sql`${pageLayout.draftLayout}`, draftLayout: null })
        .where(eq(pageLayout.page, input.page));
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "content.publish",
        entity:    `page:${input.page}`,
        detail:    `Published ${input.page}`,
      });
    }),

  discard: editorProcedure
    .input(z.object({ page: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(pageLayout)
        .set({ draftLayout: null })
        .where(eq(pageLayout.page, input.page));
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "content.discard",
        entity:    `page:${input.page}`,
        detail:    `Discarded draft for ${input.page}`,
      });
    }),
});
