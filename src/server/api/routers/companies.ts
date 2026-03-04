import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, editorProcedure } from "~/server/api/trpc";
import { companies, auditLog } from "~/server/db/schema";
import type { db as dbType } from "~/server/db";

type Ctx = { db: typeof dbType; session: { user: { id: string; email: string } } };

function writeAudit(ctx: Ctx, action: string, detail?: string) {
  return ctx.db.insert(auditLog).values({
    userId:    ctx.session.user.id,
    userEmail: ctx.session.user.email,
    action,
    entity:    "company",
    detail,
  });
}

export const companiesRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(companies).orderBy(asc(companies.order));
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(companies)
        .where(eq(companies.slug, input.slug))
        .get();
    }),

  upsert: editorProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        tagline: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        status: z.enum(["active", "coming_soon", "archived"]).default("active"),
        order: z.number().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        await ctx.db.update(companies).set(data).where(eq(companies.id, id));
        await writeAudit(ctx, "company.update", input.name);
      } else {
        await ctx.db.insert(companies).values(data);
        await writeAudit(ctx, "company.create", input.name);
      }
    }),

  reorder: editorProcedure
    .input(z.array(z.object({ id: z.number(), order: z.number() })))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.map(({ id, order }) =>
          ctx.db.update(companies).set({ order }).where(eq(companies.id, id)),
        ),
      );
      await writeAudit(ctx, "company.reorder");
    }),

  delete: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.select({ name: companies.name }).from(companies).where(eq(companies.id, input.id)).get();
      await ctx.db.delete(companies).where(eq(companies.id, input.id));
      await writeAudit(ctx, "company.delete", company?.name);
    }),
});
