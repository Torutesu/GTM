FROM node:22-alpine AS base
RUN npm install -g pnpm@10

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/packages ./packages
RUN npx prisma generate

EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/main.js"]
