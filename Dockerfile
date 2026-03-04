FROM node:20-alpine
WORKDIR /app

# Native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++
RUN npm install -g bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Build (skip env validation — real vars injected at runtime by Coolify)
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

# Persistent volume mount points (set in Coolify)
RUN mkdir -p /data public/uploads

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Migrate + seed (idempotent) then start
CMD ["sh", "-c", "bun run db:push && bun run db:seed && bun run start"]
