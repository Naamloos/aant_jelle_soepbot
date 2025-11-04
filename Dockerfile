# syntax=docker/dockerfile:1

# Install dependencies (including devDeps for build)
FROM node:22-alpine AS deps
WORKDIR /app
# Copy manifest(s) and install
COPY package*.json ./
RUN sh -c "if [ -f package-lock.json ]; then npm ci; else npm install; fi"

# Build TypeScript -> dist using tsup
FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production runner image

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
# Install fonts for @napi-rs/canvas
RUN apk add --no-cache ttf-freefont fontconfig
# Copy only the runtime artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Run as non-root (pre-created user in node image)
USER node
CMD ["node", "dist/index.cjs"]
