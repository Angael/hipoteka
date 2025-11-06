###############################
# Stage 1: Build with Node + pnpm
###############################
FROM node:20-alpine AS builder

ENV CI=1
WORKDIR /app

# Enable corepack to use pnpm without global install
RUN corepack enable

# Copy only dependency manifests first for better layer caching
COPY package.json pnpm-lock.yaml* ./

# Install deps (prefer lockfile; if missing, fall back without --frozen-lockfile)
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

# Copy source
COPY . .

# Build (TypeScript + Vite)
RUN pnpm build

###############################
# Stage 2: Serve static build with nginx
###############################
FROM nginx:stable-alpine3.21 AS final

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]