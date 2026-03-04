import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { teamRouter } from "~/server/api/routers/team";
import { companiesRouter } from "~/server/api/routers/companies";
import { contentRouter } from "~/server/api/routers/content";
import { contactRouter } from "~/server/api/routers/contact";
import { layoutRouter } from "~/server/api/routers/layout";
import { usersRouter } from "~/server/api/routers/users";
import { settingsRouter } from "~/server/api/routers/settings";
import { auditRouter } from "~/server/api/routers/audit";
import { companyPageRouter } from "~/server/api/routers/companyPage";
import { postsRouter } from "~/server/api/routers/posts";

export const appRouter = createTRPCRouter({
  team: teamRouter,
  companies: companiesRouter,
  content: contentRouter,
  contact: contactRouter,
  layout: layoutRouter,
  users: usersRouter,
  settings: settingsRouter,
  audit: auditRouter,
  companyPage: companyPageRouter,
  posts: postsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
