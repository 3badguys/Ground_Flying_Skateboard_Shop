FROM node:22-alpine AS base
ARG NPM_REGISTRY
WORKDIR /app

# pg_dump / psql required by the backup & restore module
RUN apk add --no-cache postgresql16-client

# Copy root workspace config + lock file for version pinning
COPY package.json package-lock.json ./

# Copy workspace package.json + prisma schema (needed for prisma generate)
COPY packages/backend/package.json packages/backend/
COPY packages/backend/prisma packages/backend/prisma
COPY packages/frontend/package.json packages/frontend/

# Install ONLY the backend workspace, --ignore-scripts for speed & security
# Rebuild bcrypt after install (native binding required)
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm ci --workspace=packages/backend --ignore-scripts \
    && npm rebuild bcrypt \
    && cd packages/backend && npx prisma generate

# Copy backend source code
COPY packages/backend/ packages/backend/

# ---- Development (hot reload) ----
FROM base AS development
WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["npx", "nest", "start", "--watch"]

# ---- Builder (compile + prune) ----
FROM base AS builder
WORKDIR /app/packages/backend
RUN npm run build \
    && ls dist/main.js \
    && npm prune --production \
    && find dist \( -name '*.d.ts' -o -name '*.js.map' \) -delete

# ---- Production (minimal runtime) ----
FROM node:22-alpine AS production
WORKDIR /app

# pg_dump / psql required by the backup & restore module
RUN apk add --no-cache postgresql16-client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/prisma ./prisma
COPY --from=builder /app/packages/backend/package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
