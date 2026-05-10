# ---- Base ----
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
# Provide a dummy DATABASE_URL so prisma generate in postinstall won't fail
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY package.json bun.lock ./
# Copy prisma schema BEFORE npm install so postinstall prisma generate can find it
COPY prisma ./prisma

RUN npm install --frozen-lockfile 2>/dev/null || npm install

# ---- Build ----
FROM base AS builder
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (idempotent) & Build Next.js
RUN npx prisma generate && npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy prisma engine and CLI for db push at startup
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy and set entrypoint permissions
COPY --from=builder /app/docker-entrypoint.sh ./
USER root
RUN chmod +x ./docker-entrypoint.sh
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
