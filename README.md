# Trellis Workforce Development — Website

Trellis creates meaningful employment for people in recovery, building life skills and leadership through real work.

This site is powered by [beenCMS](https://github.com/soconnor0919/beencms).

## Local development

```bash
cp .env.example .env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
bun install
bun run db:push
bun run db:seed
bun run dev
```

## Pulling engine updates

```bash
git fetch upstream
git merge upstream/main
```

Instance files (`src/config/cms.ts`, `src/app/(site)/**`, `public/**`, `README.md`) are protected
by `.gitattributes merge=ours` and will never be overwritten by upstream merges.
