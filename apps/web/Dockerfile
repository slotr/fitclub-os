# syntax=docker/dockerfile:1.7
# Build the Next.js app in standalone mode inside a pnpm monorepo.

ARG NODE_VERSION=20

# ---------- 1. deps ----------
FROM node:${NODE_VERSION}-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /repo

# Workspace metadata first so the install layer caches well.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/emails/package.json packages/emails/

RUN pnpm install --frozen-lockfile

# ---------- 2. builder ----------
FROM node:${NODE_VERSION}-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules

# Source — kept narrow so unrelated edits don't bust the build cache.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc turbo.json tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages ./packages

# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so they must be present here — runtime env vars cannot change them.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @fitness/web build

# ---------- 3. runtime ----------
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Next standalone bundle (includes a minimal node_modules) lives at
# apps/web/.next/standalone; static assets at apps/web/.next/static.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
