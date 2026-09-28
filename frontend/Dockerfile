# Stage 1: Build React Vite app with production optimizations
FROM node:20-alpine AS build

WORKDIR /app

# Build-time API URL embedding (Vite embeds VITE_* env vars during build)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: High-performance Nginx runtime for SPA and static assets
FROM nginx:alpine

# Install gettext (for envsubst) and curl (for healthcheck)
RUN apk add --no-cache gettext curl

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx template and entrypoint script
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default port (Render provides dynamic $PORT at runtime, e.g. 10000)
ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD curl -f http://localhost:${PORT:-80}/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
