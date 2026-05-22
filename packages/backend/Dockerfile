FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN npm install && npx prisma generate
COPY . .

# ---- Development (hot reload) ----
FROM base AS development
EXPOSE 3000
CMD ["npx", "nest", "start", "--watch"]

# ---- Builder (compile + prune) ----
FROM base AS builder
RUN npx nest build && npm prune --production && find /app/dist -name '*.d.ts' -o -name '*.js.map' | xargs rm -f

# ---- Production (minimal runtime) ----
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
