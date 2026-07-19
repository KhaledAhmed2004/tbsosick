# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built assets from builder (changing ownership for security)
COPY --from=builder --chown=node:node /app/dist ./dist
# Copy public/assets if needed
COPY --from=builder --chown=node:node /app/public ./public
# Copy any other necessary folders (e.g., scripts)
COPY --from=builder --chown=node:node /app/scripts ./scripts

# Set environment to production
ENV NODE_ENV=production

# Expose port (adjust if your app uses a different one)
EXPOSE 5000

# Implement Healthcheck so Docker knows if the app hangs
# Implement Healthcheck so Docker knows if the app hangs (using dynamic port)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/ || exit 1

# Give the node user permission to create new folders (like winston logs) in the /app directory
RUN chown node:node /app

# Switch to non-root user for security
USER node

# Start the application directly with node (avoiding npm wrapper)
CMD ["node", "dist/server.js"]
