# GON — AI Marketing Team

Autonomous AI-powered marketing platform. Connect your social accounts, get AI-driven strategy, and automate content creation and publishing.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client
pnpm db:generate

# 3. Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 4. Start development servers (Next.js :3000 + NestJS :3001)
pnpm dev
```

## Environment Variables

### `apps/api/.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 64+ char string for JWT signing |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o-mini) |
| `TOKEN_ENCRYPTION_KEY` | 32 hex chars for OAuth token encryption |
| `X_CLIENT_ID` | X (Twitter) OAuth 2.0 Client ID |
| `X_CLIENT_SECRET` | X OAuth 2.0 Client Secret |
| `X_REDIRECT_URI` | OAuth callback URL |
| `FRONTEND_URL` | Frontend URL for CORS |

### `apps/web/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (`http://localhost:3001`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |

## Architecture

```
apps/
  web/        Next.js 14 (App Router) — Frontend
  api/        NestJS — Backend API
packages/
  shared/     Shared types, Zod schemas
```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Sign in
- `POST /api/v1/auth/refresh` — Refresh tokens

### Integrations
- `GET  /api/v1/integrations` — List connected accounts
- `POST /api/v1/integrations/auth-url` — Get OAuth URL
- `POST /api/v1/integrations/callback` — Handle OAuth callback
- `DELETE /api/v1/integrations/:id` — Disconnect

### Posts
- `GET  /api/v1/posts` — List posts
- `POST /api/v1/posts` — Create draft
- `PATCH /api/v1/posts/:id` — Update post
- `POST /api/v1/posts/:id/approve` — Approve for publishing
- `POST /api/v1/posts/:id/publish` — Publish to SNS

### Agents
- `POST /api/v1/agents/execute` — Run an AI agent
- `GET  /api/v1/agents/tasks` — List agent tasks

### Chat
- `POST /api/v1/chat/messages` — Send message to AI

## Deploy

### Frontend (Vercel)
Connect your GitHub repo to Vercel, set env vars from `apps/web/.env.example`.

### Backend (Railway)
Connect your GitHub repo, set env vars from `apps/api/.env.example`.
Uses the Dockerfile in `apps/api/` for deployment.
