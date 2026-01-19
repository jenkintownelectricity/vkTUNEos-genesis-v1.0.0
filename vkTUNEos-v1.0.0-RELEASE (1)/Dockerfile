# vkTUNEos Music Kernel
# Docker deployment configuration

FROM node:22-alpine

LABEL maintainer="Lefebvre Design Solutions LLC"
LABEL description="vkTUNEos Music Kernel - Vector Authority v1.0 Compliant"
LABEL version="0.1.0"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run the application
CMD ["npm", "start"]
