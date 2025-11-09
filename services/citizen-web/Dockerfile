# Multi-stage build for optimized production image

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (including .env for build-time - used in local dev)
# Note: .env won't exist in CI/CD, but we create a minimal one for build to succeed
COPY . .

# Create minimal .env if it doesn't exist (for CI/CD builds)
RUN if [ ! -f .env ]; then \
      echo "VITE_API_BASE_URL=/api/v1" > .env && \
      echo "VITE_OPERATOR_ID=micarpeta" >> .env && \
      echo "VITE_OPERATOR_NAME=MiCarpeta" >> .env; \
    fi

# Build the application
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine

# Install envsubst (part of gettext package)
RUN apk add --no-cache gettext

# Create non-root user and group (using UID/GID 1001 to avoid conflicts)
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-app -g nginx-app nginx-app

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template

# Copy docker entrypoint script and ensure Unix line endings
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN dos2unix /docker-entrypoint.sh 2>/dev/null || sed -i 's/\r$//' /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create necessary directories and set permissions
# IMPORTANT: entrypoint runs as nginx-app and needs write permissions for config.js
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid && \
    chown nginx-app:nginx-app /docker-entrypoint.sh

# Expose port 8080 (non-privileged port)
EXPOSE 8080

# Switch to non-root user
USER nginx-app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Use entrypoint script to generate runtime config
ENTRYPOINT ["/docker-entrypoint.sh"]

