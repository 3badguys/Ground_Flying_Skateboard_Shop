FROM node:22-alpine AS base
ARG NPM_REGISTRY
WORKDIR /app

# Copy root workspace config + lock file for version pinning
COPY package.json package-lock.json ./

# Copy both workspace package.json so npm can resolve the workspace list
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/

# Install ONLY the frontend workspace, --ignore-scripts for speed & security
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm ci --workspace=packages/frontend --ignore-scripts

# Copy frontend source code
COPY packages/frontend/ packages/frontend/

# ---- Dev Stage ----
FROM base AS development
WORKDIR /app/packages/frontend
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ---- Prod Stage ----
FROM base AS builder
WORKDIR /app/packages/frontend
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
