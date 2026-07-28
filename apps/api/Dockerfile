# Base image
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
ENV CI=true
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install dependencies (including devDependencies needed for building)
RUN pnpm install --frozen-lockfile

# Copy the rest of the workspace files
COPY packages/shared/ ./packages/shared/
COPY packages/config/ ./packages/config/
COPY apps/api/ ./apps/api/

# Build shared package first, then generate prisma, then build the api
RUN pnpm --filter @assos/shared build
RUN pnpm --filter @assos/api exec prisma generate
RUN pnpm --filter @assos/api build

# Prune dev dependencies for production stage
RUN pnpm prune --prod

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built code and node_modules from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 4000
CMD ["pnpm", "--filter", "@assos/api", "start:prod"]
