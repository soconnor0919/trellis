import { sql } from "drizzle-orm";
import { index, integer, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

export const createTable = sqliteTableCreator((name) => `trellis_${name}`);

// ─── BetterAuth required tables ───────────────────────────────────────────────

export const user = createTable("user", (d) => ({
  id: d.text().primaryKey(),
  name: d.text().notNull(),
  email: d.text().notNull().unique(),
  emailVerified: d.integer({ mode: "boolean" }).notNull().default(false),
  image: d.text(),
  createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}));

export const session = createTable("session", (d) => ({
  id: d.text().primaryKey(),
  expiresAt: d.integer({ mode: "timestamp" }).notNull(),
  token: d.text().notNull().unique(),
  createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  ipAddress: d.text(),
  userAgent: d.text(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
}));

export const account = createTable("account", (d) => ({
  id: d.text().primaryKey(),
  accountId: d.text().notNull(),
  providerId: d.text().notNull(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: d.text(),
  refreshToken: d.text(),
  idToken: d.text(),
  accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
  refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
  scope: d.text(),
  password: d.text(),
  createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}));

export const verification = createTable("verification", (d) => ({
  id: d.text().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.integer({ mode: "timestamp" }).notNull(),
  createdAt: d.integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: d.integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
}));

// ─── CMS: Team Members ────────────────────────────────────────────────────────

export const teamMembers = createTable(
  "team_member",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    role: d.text({ length: 256 }).notNull(),
    bio: d.text(),
    imageUrl: d.text(),
    order: d.integer({ mode: "number" }).notNull().default(0),
    isAffiliate: d.integer({ mode: "boolean" }).notNull().default(false),
    createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("team_order_idx").on(t.order)],
);

// ─── CMS: Companies / Programs ────────────────────────────────────────────────

export const companies = createTable(
  "company",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    slug: d.text({ length: 256 }).notNull().unique(),
    tagline: d.text({ length: 512 }),
    description: d.text(),
    imageUrl: d.text(),
    status: d.text({ enum: ["active", "coming_soon", "archived"] }).notNull().default("active"),
    order: d.integer({ mode: "number" }).notNull().default(0),
    createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("company_slug_idx").on(t.slug),
    index("company_order_idx").on(t.order),
  ],
);

// ─── CMS: Page Content (key/value blocks for editable sections) ───────────────

export const pageContent = createTable(
  "page_content",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    page: d.text({ length: 128 }).notNull(),   // e.g. "home", "about", "donate"
    key: d.text({ length: 128 }).notNull(),    // e.g. "hero_title", "hero_body"
    value: d.text().notNull(),
    draftValue: d.text(),  // null = no pending draft; set by admin, cleared on publish
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("page_content_idx").on(t.page, t.key)],
);

// ─── Block-based page layouts ─────────────────────────────────────────────────

export const pageLayout = createTable("page_layout", (d) => ({
  id:          d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  page:        d.text({ length: 128 }).notNull().unique(),
  layout:      d.text().notNull().default("[]"), // JSON: Block[]
  draftLayout: d.text(),                          // JSON: Block[] | null
  updatedAt:   d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

// ─── User profiles & roles ────────────────────────────────────────────────────

export const userProfile = createTable("user_profile", (d) => ({
  userId: d.text().primaryKey().references(() => user.id, { onDelete: "cascade" }),
  role:   d.text({ enum: ["admin", "editor", "viewer"] }).notNull().default("viewer"),
}));

// ─── Site settings (white-label) ─────────────────────────────────────────────

export const siteSettings = createTable("site_settings", (d) => ({
  id:             d.integer().primaryKey({ autoIncrement: true }),
  siteName:       d.text().notNull().default("Trellis Workforce Development"),
  siteUrl:        d.text(),
  logoUrl:        d.text(),
  iconUrl:        d.text(),
  primaryColor:   d.text().notNull().default("#8a7d55"),
  accentColor:    d.text().notNull().default("#f8f5ee"),
  textColor:      d.text().notNull().default("#2c2826"),
  bodyFont:       d.text().notNull().default("Source Sans 3"),
  headingFont:    d.text().notNull().default("Georgia"),
  navLinks:       d.text().notNull().default("[]"),      // JSON: [{label,href}]
  footerTagline:  d.text(),
  contactEmail:   d.text(),
  contactPhone:   d.text(),
  address:        d.text(),
  socialLinks:    d.text().notNull().default("[]"),      // JSON: [{platform,url}]
  seoTitle:       d.text(),
  seoDescription: d.text(),
  updatedAt:      d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

// ─── Contact form submissions ─────────────────────────────────────────────────

export const contactSubmissions = createTable("contact_submission", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: d.text({ length: 256 }).notNull(),
  email: d.text({ length: 256 }).notNull(),
  subject: d.text({ length: 512 }),
  message: d.text().notNull(),
  read: d.integer({ mode: "boolean" }).notNull().default(false),
  createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}));

// ─── Audit log ────────────────────────────────────────────────────────────────

export const auditLog = createTable(
  "audit_log",
  (d) => ({
    id:        d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId:    d.text().references(() => user.id, { onDelete: "set null" }),
    userEmail: d.text({ length: 256 }),          // denormalized for display after user deletion
    action:    d.text({ length: 128 }).notNull(), // e.g. "content.save", "team.delete"
    entity:    d.text({ length: 128 }),           // e.g. "page:home", "team:5"
    detail:    d.text(),                          // optional human-readable summary
    createdAt: d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  }),
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

// ─── Company sub-page layouts ─────────────────────────────────────────────────

export const companyPage = createTable("company_page", (d) => ({
  id:          d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  companyId:   d.integer({ mode: "number" }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  layout:      d.text().notNull().default("[]"), // JSON: Block[]
  draftLayout: d.text(),                          // JSON: Block[] | null
  updatedAt:   d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

// ─── Blog posts ────────────────────────────────────────────────────────────────

export const post = createTable(
  "post",
  (d) => ({
    id:          d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    title:       d.text({ length: 512 }).notNull(),
    slug:        d.text({ length: 256 }).notNull().unique(),
    excerpt:     d.text(),
    coverImage:  d.text(),
    layout:      d.text().notNull().default("[]"),  // JSON: Block[]
    draftLayout: d.text(),                           // JSON: Block[] | null
    status:      d.text({ enum: ["draft", "published"] }).notNull().default("draft"),
    publishedAt: d.integer({ mode: "timestamp" }),
    category:    d.text({ length: 128 }),
    authorId:    d.text().references(() => user.id, { onDelete: "set null" }),
    createdAt:   d.integer({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt:   d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("post_slug_idx").on(t.slug),
    index("post_status_idx").on(t.status),
    index("post_published_idx").on(t.publishedAt),
  ],
);
