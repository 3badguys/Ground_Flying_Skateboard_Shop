FROM node:22-alpine AS base
ARG NPM_REGISTRY
WORKDIR /app
COPY package.json ./
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm install
COPY . .

# ---- Dev Stage ----
FROM base AS development
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ---- Prod Stage ----
FROM base AS builder
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
