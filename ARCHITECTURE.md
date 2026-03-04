# beenCMS Architecture

beenCMS is a white-label Next.js content management engine. The codebase is split into two logical layers:

- **Engine** — the CMS core (admin UI, tRPC routers, DB schema, block system). Maintained in this repo, pulled upstream by all forks.
- **Instance** — the client-specific skin (public-facing pages, branding, feature flags, content pages). Lives in the fork, never overwritten by upstream merges.

---

## Directory Overview

```
src/
├── app/
│   ├── (admin)/          # ENGINE — admin shell, all /admin/* pages
│   ├── (site)/           # INSTANCE — public-facing pages (home, about, etc.)
│   └── api/              # ENGINE — upload handler, draft routes, auth
├── components/
│   ├── admin/            # ENGINE — BlockEditor, AdminTabs, PageHeader, etc.
│   ├── ui/               # ENGINE — shadcn primitives (do not edit directly)
│   ├── Logo.tsx          # INSTANCE — renders /logo.svg with appDefaults.name
│   ├── ThemeInjector.tsx # ENGINE — injects DB color vars into <html>
│   └── ThemeProvider.tsx # ENGINE — next-themes dark/light wrapper
├── config/
│   └── cms.ts            # INSTANCE — feature flags, pages, default theme, app identity
├── lib/
│   ├── blocks.ts         # ENGINE — block type definitions
│   ├── theme.ts          # ENGINE — CSS var builder, WCAG contrast helper
│   └── utils.ts          # ENGINE — cn(), shared utils
├── server/
│   ├── api/              # ENGINE — tRPC root + routers
│   └── db/               # ENGINE — Drizzle ORM schema + client
├── styles/
│   └── globals.css       # ENGINE — Tailwind v4 @theme, CSS custom properties
└── trpc/                 # ENGINE — tRPC React provider + server caller
public/                   # INSTANCE — logo.svg, icon.svg, og-image.png, favicon.ico
```

---

## Engine vs. Instance File Table

| Path | Owner | Notes |
|------|-------|-------|
| `src/config/cms.ts` | **Instance** | Feature flags, content page list, default theme, app name |
| `src/app/(site)/**` | **Instance** | All public-facing route pages and layout |
| `src/components/Logo.tsx` | **Instance** | Swap src/alt to use your logo file |
| `public/**` | **Instance** | Replace logo.svg, icon.svg, og-image.png |
| `.env`, `.env.local`, `.env.example` | **Instance** | DB path, auth secret, base URL |
| `README.md` | **Instance** | Client-specific readme |
| `bun.lock` | **Instance** | Locked per-project |
| `src/app/(admin)/**` | **Engine** | Admin shell — pull upstream improvements freely |
| `src/components/admin/**` | **Engine** | Shared admin UI components |
| `src/components/ui/**` | **Engine** | shadcn component library |
| `src/lib/**` | **Engine** | Block types, theme utilities, helpers |
| `src/server/**` | **Engine** | DB schema, tRPC routers, auth config |
| `src/styles/globals.css` | **Engine** | Tailwind theme tokens (colors overridden at runtime via DB) |

---

## Fork Workflow

### Starting a new client project

```bash
# 1. Fork this repo on GitHub (or clone + push to new remote)
git clone https://github.com/soconnor0919/beencms my-client-cms
cd my-client-cms
git remote rename origin upstream
git remote add origin https://github.com/soconnor0919/my-client-cms
git push -u origin main

# 2. One-time: enable the merge=ours driver
git config merge.ours.driver true

# 3. Configure the instance
#    Edit src/config/cms.ts — set appDefaults.name, contentPages, features, defaultTheme
#    Replace public/logo.svg, public/icon.svg, public/og-image.png
#    Edit src/components/Logo.tsx if you need custom logo rendering
#    Build out src/app/(site)/ for this client's public pages

# 4. Set up your environment
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL

# 5. Push schema to DB and seed defaults
bun run db:push
bun run db:seed
```

### Pulling engine updates from upstream

```bash
git fetch upstream
git merge upstream/main
# Files marked merge=ours (cms.ts, (site)/**, public/**, etc.) are NEVER overwritten.
# Review the merge diff and resolve any engine-level conflicts.
```

The `merge=ours` attributes in `.gitattributes` ensure this is safe to run at any time without losing client customizations.

---

## Instance Configuration (`src/config/cms.ts`)

This is the single file you change to configure a new client. All values here are compile-time / build-time defaults. Runtime overrides (logo URL, colors, SEO title) are stored in the `site_settings` DB table and take precedence at request time.

```ts
// Engine identity — do not change in forks
export const cmsInfo = { name: "beenCMS", version: "1.0.0" };

// Which public pages appear in the Page Content editor
export const contentPages = [
  { page: "home",   label: "Home",   href: "/" },
  { page: "about",  label: "About",  href: "/about" },
];

// Toggle entire admin sections on/off
export const features = {
  programs: true,   // /admin/companies — portfolio/program entries
  team:     true,   // /admin/team      — team member profiles
  messages: true,   // /admin/messages  — contact form inbox
};

// CSS color defaults (overridden by Settings > Branding at runtime)
export const defaultTheme = {
  primaryColor: "#8a7d55",
  accentColor:  "#f8f5ee",
};

// Site identity defaults (overridden by Settings > General at runtime)
export const appDefaults = {
  name:        "Client Site Name",
  description: "One-line site description for SEO.",
};
```

---

## Runtime Theme Override

Colors set in **Admin > Settings > Branding** override the compile-time `defaultTheme` values at request time — no rebuild required.

The chain:

1. `globals.css` defines baseline tokens: `--primary: #8a7d55` etc.
2. `ThemeInjector` (async RSC in `app/layout.tsx`) reads `site_settings.primaryColor` from DB.
3. If it differs from the default, it injects `<style>:root { --primary: ...; }</style>` into the `<head>` before the page body renders — no flash of unstyled content.
4. The `buildThemeCSS()` function in `src/lib/theme.ts` automatically computes `--primary-foreground` using WCAG relative luminance so button text is always readable.

---

## Block System

Content pages and company/program entries are built from blocks. Block types are defined in `src/lib/blocks.ts` and rendered by `src/components/BlockRenderer.tsx`. The admin editor (`src/components/admin/BlockEditor.tsx`) handles creating, reordering, and editing blocks.

Adding a new block type:
1. Add the union type + default factory to `src/lib/blocks.ts`
2. Add an editor form in `BlockEditor.tsx` and entry in `BLOCK_META`
3. Add a renderer case in `BlockRenderer.tsx`

---

## Database

SQLite via Drizzle ORM (`better-sqlite3`). Schema lives in `src/server/db/schema.ts`.

Key tables:

| Table | Purpose |
|-------|---------|
| `user` | BetterAuth managed users |
| `user_profile` | Role (`admin` / `editor` / `viewer`) per user |
| `session` | Auth sessions |
| `page_layout` | Published block layouts per page key |
| `page_draft` | Unpublished draft layouts |
| `team_member` | Team member profiles |
| `company` | Program/company entries |
| `company_layout` | Block content per company page |
| `message` | Contact form submissions |
| `site_settings` | Single-row runtime configuration |

```bash
bun run db:push    # Apply schema to local SQLite (dev)
bun run db:seed    # Insert default siteSettings row + initial admin user
bun run db:studio  # Open Drizzle Studio UI
```

---

## Environment Variables

```bash
# .env.local
DATABASE_URL="file:./db.sqlite"
BETTER_AUTH_SECRET="generate with: openssl rand -base64 32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Key Design Decisions

**Why SQLite?** Zero-ops for small/medium sites. Each client project has its own DB file. Trivially portable — back up by copying one file.

**Why no S3 for uploads?** Images upload to `public/uploads/` and are served as Next.js static files. Simple, zero-cost, no cloud dependencies. Swap `src/app/api/upload/route.ts` to point at S3/Cloudflare R2 if needed.

**Why `.gitattributes` over directory structure?** The engine/instance split is logical, not physical. Forcing all instance files into a separate top-level directory would require rearranging Next.js App Router conventions. The `merge=ours` attribute achieves the same protection without structural overhead.

**Why a single `cms.ts`?** One file to change per fork = predictable onboarding. New features are toggled here before being moved to DB-driven settings if needed.
