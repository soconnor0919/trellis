import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import {
  createTRPCRouter,
  publicProcedure,
  editorProcedure,
} from "~/server/api/trpc";
import { post, auditLog } from "~/server/db/schema";

export const postsRouter = createTRPCRouter({
  // ── Public ──────────────────────────────────────────────────────────────────

  getAll: publicProcedure
    .input(z.object({
      status:   z.enum(["draft", "published", "all"]).default("published"),
      category: z.string().optional(),
    }))
    .query(({ ctx, input }) => {
      const conditions = [];
      if (input.status !== "all") {
        conditions.push(eq(post.status, input.status));
      }
      if (input.category) {
        conditions.push(eq(post.category, input.category));
      }
      return ctx.db
        .select({
          id:          post.id,
          title:       post.title,
          slug:        post.slug,
          excerpt:     post.excerpt,
          coverImage:  post.coverImage,
          status:      post.status,
          publishedAt: post.publishedAt,
          category:    post.category,
          createdAt:   post.createdAt,
          updatedAt:   post.updatedAt,
        })
        .from(post)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(post.publishedAt), desc(post.createdAt));
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.select().from(post).where(eq(post.slug, input.slug)).get() ?? null;
    }),

  getById: editorProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.select().from(post).where(eq(post.id, input.id)).get() ?? null;
    }),

  // ── Editor ──────────────────────────────────────────────────────────────────

  upsert: editorProcedure
    .input(z.object({
      id:         z.number().optional(),
      title:      z.string().min(1).max(512),
      slug:       z.string().min(1).max(256),
      excerpt:    z.string().max(1000).optional(),
      coverImage: z.string().optional(),
      category:   z.string().max(128).optional(),
      status:     z.enum(["draft", "published"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;
      const publishedAt = values.status === "published" ? new Date() : undefined;

      if (id) {
        await ctx.db.update(post).set({ ...values, publishedAt }).where(eq(post.id, id));
        await ctx.db.insert(auditLog).values({
          userId:    ctx.session.user.id,
          userEmail: ctx.session.user.email,
          action:    "post.update",
          entity:    `post:${id}`,
          detail:    `Updated post "${values.title}"`,
        });
        return { id };
      } else {
        const [row] = await ctx.db
          .insert(post)
          .values({ ...values, publishedAt, authorId: ctx.session.user.id })
          .returning({ id: post.id });
        await ctx.db.insert(auditLog).values({
          userId:    ctx.session.user.id,
          userEmail: ctx.session.user.email,
          action:    "post.create",
          entity:    `post:${row!.id}`,
          detail:    `Created post "${values.title}"`,
        });
        return { id: row!.id };
      }
    }),

  saveDraft: editorProcedure
    .input(z.object({ id: z.number(), draftLayout: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(post)
        .set({ draftLayout: input.draftLayout })
        .where(eq(post.id, input.id));
    }),

  publish: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const row = ctx.db.select({ layout: post.layout, draftLayout: post.draftLayout, title: post.title })
        .from(post).where(eq(post.id, input.id)).get();
      const newLayout = row?.draftLayout ?? row?.layout ?? "[]";
      await ctx.db.update(post).set({
        layout:      newLayout,
        draftLayout: null,
        status:      "published",
        publishedAt: new Date(),
      }).where(eq(post.id, input.id));
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "post.publish",
        entity:    `post:${input.id}`,
        detail:    `Published post "${row?.title ?? ""}"`
      });
    }),

  discard: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(post).set({ draftLayout: null }).where(eq(post.id, input.id));
    }),

  delete: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const row = ctx.db.select({ title: post.title }).from(post).where(eq(post.id, input.id)).get();
      await ctx.db.delete(post).where(eq(post.id, input.id));
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "post.delete",
        entity:    `post:${input.id}`,
        detail:    `Deleted post "${row?.title ?? ""}"`,
      });
    }),
});
