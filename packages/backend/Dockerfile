FROM node:22-alpine AS base
ARG NPM_REGISTRY
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm install && npx prisma generate
COPY . .

# ---- Development (hot reload) ----
FROM base AS development
EXPOSE 3000
CMD ["npx", "nest", "start", "--watch"]

# ---- Builder (compile + prune) ----
FROM base AS builder
RUN npm run build \
    && ls /app/dist/main.js \
    && npm prune --production \
    && find /app/dist \( -name '*.d.ts' -o -name '*.js.map' \) -delete

# ---- Production (minimal runtime) ----
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
