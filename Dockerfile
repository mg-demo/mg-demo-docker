# Use official Node.js LTS image
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files and install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build final image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
RUN rm -rf node_modules

# Ensure app files owned by non-root user and drop privileges
RUN chown -R node:node /app
USER node

RUN npm ci --only=production

# Runtime environment variables
ENV NODE_ENV=production

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["node", "src/server.js"]
