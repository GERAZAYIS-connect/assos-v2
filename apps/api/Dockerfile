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

# Deploy standalone package for production
RUN pnpm --filter=@assos/api --prod deploy /app/deploy --legacy

# Copy the built dist and the already-generated Prisma client into the deploy folder
RUN cp -r /app/apps/api/dist /app/deploy/dist
RUN find /app/node_modules/.pnpm -type d -name '.prisma' | head -1 | xargs -I{} cp -r {} /app/deploy/node_modules/

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone deployed files (includes generated prisma client)
COPY --from=builder /app/deploy ./

EXPOSE 4000
CMD ["node", "dist/main"]
