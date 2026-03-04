# beenCMS

A white-label Next.js content management engine. Fork once, power any number of client sites.

## What's included

- Block-based page editor with draft/publish workflow
- Admin sections: team members, programs/companies, blog, contact inbox
- Runtime color & font theming — changes without a rebuild
- Admin roles: admin / editor / viewer
- SQLite + Drizzle ORM (zero ops, one-file DB)
- BetterAuth email/password sessions
- Dark mode

## Tech stack

Next.js · tRPC · Drizzle ORM · better-sqlite3 · BetterAuth · Tailwind v4 · shadcn/ui

## Quick start

```bash
cp .env.example .env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
bun install
bun run db:push
bun run db:seed
bun run dev
```

## Forking for a new client

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full fork workflow and file ownership map.

```bash
git clone https://github.com/soconnor/beencms my-client
cd my-client
git remote rename origin upstream
gh repo create soconnor/my-client --public --source=. --push
git remote add origin https://github.com/soconnor/my-client
git config merge.ours.driver true
# Edit src/config/cms.ts, replace public/ assets, build out src/app/(site)/
```

## Pulling engine updates

```bash
git fetch upstream
git merge upstream/main   # instance files (cms.ts, (site)/**, public/**) are never overwritten
```
