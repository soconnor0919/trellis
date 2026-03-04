import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, editorProcedure } from "~/server/api/trpc";
import { companyPage, companies, auditLog } from "~/server/db/schema";

export const companyPageRouter = createTRPCRouter({
  /** Get page content for a company (by company id) */
  getByCompanyId: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select()
        .from(companyPage)
        .where(eq(companyPage.companyId, input.companyId))
        .get();
      return row ?? { id: 0, companyId: input.companyId, layout: "[]", draftLayout: null, updatedAt: null };
    }),

  /** Get page content for a company (by slug) */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, input.slug))
        .get();
      if (!company) return null;
      const row = await ctx.db
        .select()
        .from(companyPage)
        .where(eq(companyPage.companyId, company.id))
        .get();
      return row ?? { id: 0, companyId: company.id, layout: "[]", draftLayout: null, updatedAt: null };
    }),

  /** Save published layout */
  save: editorProcedure
    .input(z.object({
      companyId:   z.number(),
      layout:      z.string(),
      draftLayout: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: companyPage.id })
        .from(companyPage)
        .where(eq(companyPage.companyId, input.companyId))
        .get();
      if (existing) {
        await ctx.db
          .update(companyPage)
          .set({ layout: input.layout, draftLayout: input.draftLayout ?? null })
          .where(eq(companyPage.companyId, input.companyId))
          .run();
      } else {
        await ctx.db.insert(companyPage).values({
          companyId:   input.companyId,
          layout:      input.layout,
          draftLayout: input.draftLayout ?? null,
        }).run();
      }
      const company = ctx.db.select({ name: companies.name }).from(companies).where(eq(companies.id, input.companyId)).get();
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "content.publish",
        entity:    `company:${input.companyId}`,
        detail:    `Published page for ${company?.name ?? `company #${input.companyId}`}`,
      });
    }),

  /** Save draft only */
  saveDraft: editorProcedure
    .input(z.object({ companyId: z.number(), draftLayout: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: companyPage.id })
        .from(companyPage)
        .where(eq(companyPage.companyId, input.companyId))
        .get();
      if (existing) {
        await ctx.db
          .update(companyPage)
          .set({ draftLayout: input.draftLayout })
          .where(eq(companyPage.companyId, input.companyId))
          .run();
      } else {
        await ctx.db.insert(companyPage).values({
          companyId:   input.companyId,
          layout:      "[]",
          draftLayout: input.draftLayout,
        }).run();
      }
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "content.save",
        entity:    `company:${input.companyId}`,
        detail:    `Saved draft for company #${input.companyId}`,
      });
    }),
});
