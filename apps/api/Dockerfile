FROM node:22-alpine AS base

FROM base AS builder
RUN npm install -g pnpm@10
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app
RUN npm install -g pnpm@10
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/main.js"]
