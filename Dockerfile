FROM node:20-bookworm-slim
WORKDIR /app

# Native build tools for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Receive NEXT_PUBLIC_* build args from Coolify
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Skip env validation — runtime vars injected by Coolify at container start
ENV SKIP_ENV_VALIDATION=1
# Prevent OOM during Next.js build
ENV NODE_OPTIONS=--max-old-space-size=2048

# Create /data before build so better-sqlite3 can open the DB path at module eval time
RUN mkdir -p /data public/uploads

RUN node ./node_modules/.bin/next build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "bun run db:push && bun run db:seed && bun run start"]
