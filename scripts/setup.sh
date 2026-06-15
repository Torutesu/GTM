#!/bin/bash
set -e

echo "=== GON Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install it from https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm; }

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Copy env files if not exists
[ ! -f apps/web/.env.local ] && cp apps/web/.env.example apps/web/.env.local && echo "Created apps/web/.env.local - edit with your values"
[ ! -f apps/api/.env ] && cp apps/api/.env.example apps/api/.env && echo "Created apps/api/.env - edit with your values"

# Generate Prisma client
echo "Generating Prisma client..."
npx -w apps/api prisma generate --schema=prisma/schema.prisma

echo ""
echo "Setup complete! Run 'pnpm dev' to start development."
echo ""
echo "Environment files to configure:"
echo "  apps/web/.env.local  - Supabase + API URL"
echo "  apps/api/.env        - Database + JWT + OpenAI keys"
