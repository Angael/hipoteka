# Stage 1: Build with Node + pnpm
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun i
COPY . .
RUN bun -v
RUN bun run build

# Stage 2: Serve static build with nginx
FROM nginx:stable-alpine3.21 AS final

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]