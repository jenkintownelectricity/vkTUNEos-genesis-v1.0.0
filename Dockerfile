# vkTUNEos Full Stack
# Open-Source AI Media Production Platform
#
# Domain: vkTUNEos.com
# Version: 1.0.0
# Zero Data Collection • Self-Hosted • Offline Mode

FROM node:22-alpine AS builder

LABEL maintainer="vkTUNEos.com"
LABEL description="vkTUNEos - Open-Source AI Media Production Platform"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/BuildingSystemsAI/vkTUNEos"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for build
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============================================================================
# Production Image
# ============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend ./frontend

# Copy configuration files
COPY vercel.json ./
COPY LICENSE ./

# Create non-root user for security
RUN addgroup -g 1001 -S vktuneos && \
    adduser -S vktuneos -u 1001 -G vktuneos

# Create directories for models and data
RUN mkdir -p /app/models /app/data /app/outputs && \
    chown -R vktuneos:vktuneos /app

# Switch to non-root user
USER vktuneos

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Volume mounts for persistence
VOLUME ["/app/models", "/app/data", "/app/outputs"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
