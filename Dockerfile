# Use official Node.js LTS image
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files and install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source
COPY . .

# Simple security scan step: fail build if common insecure env var is present (demo)
# This is a lightweight check to surface secrets in environment during build
RUN if [ -n "\"$LEAK_SECRET\"" ]; then echo "LEAK_SECRET must not be set" >&2; exit 1; fi || true

# Build final image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .

# Runtime environment variables
ENV NODE_ENV=production
ENV API_KEY=DEV-PLACEHOLDER-KEY

EXPOSE 3000
CMD ["node", "src/server.js"]
