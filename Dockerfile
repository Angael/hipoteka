# Stage 1 - Build app with bun
FROM oven/bun AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun --bun run build

# Stage 2 - Serve app with nginx server
FROM nginx:stable-alpine3.21 AS final

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# tell Docker to run nginx in the foreground, so the container doesn't exit
CMD ["nginx", "-g", "daemon off;"]