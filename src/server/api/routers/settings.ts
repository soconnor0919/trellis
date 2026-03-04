import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";
import { siteSettings, auditLog } from "~/server/db/schema";

export const settingsRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.select().from(siteSettings).get();
    if (!row) {
      return {
        id: 0,
        siteName: "Trellis Workforce Development",
        siteUrl: null,
        logoUrl: "/logo.svg",
        iconUrl: "/icon.svg",
        primaryColor: "#8a7d55",
        accentColor: "#f8f5ee",
        textColor: "#2c2826",
        bodyFont: "Source Sans 3",
        headingFont: "Georgia",
        navLinks: "[]",
        footerTagline: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        socialLinks: "[]",
        seoTitle: null,
        seoDescription: null,
        updatedAt: null,
      };
    }
    return row;
  }),

  update: adminProcedure
    .input(z.object({
      siteName:       z.string().min(1),
      siteUrl:        z.string().nullish(),
      logoUrl:        z.string().nullish(),
      iconUrl:        z.string().nullish(),
      primaryColor:   z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accentColor:    z.string().regex(/^#[0-9a-fA-F]{6}$/),
      textColor:      z.string().regex(/^#[0-9a-fA-F]{6}$/),
      bodyFont:       z.string(),
      headingFont:    z.string(),
      navLinks:       z.string().default("[]"),
      footerTagline:  z.string().nullish(),
      contactEmail:   z.string().email().nullish().or(z.literal("")),
      contactPhone:   z.string().nullish(),
      address:        z.string().nullish(),
      socialLinks:    z.string().default("[]"),
      seoTitle:       z.string().nullish(),
      seoDescription: z.string().nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.select({ id: siteSettings.id }).from(siteSettings).get();
      if (existing) {
        await ctx.db.update(siteSettings).set(input).run();
      } else {
        await ctx.db.insert(siteSettings).values(input).run();
      }
      await ctx.db.insert(auditLog).values({
        userId:    ctx.session.user.id,
        userEmail: ctx.session.user.email,
        action:    "settings.update",
        entity:    "site_settings",
        detail:    input.siteName,
      });
    }),
});
