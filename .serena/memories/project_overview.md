# AIAG Marketplace - Project Overview

## Purpose
AIAG is an AI Models Marketplace with payment processing via Tinkoff Acquiring.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 19, MUI (Material-UI), TypeScript
- **Backend**: Hono API Gateway, NextAuth.js v5
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Payments**: Tinkoff Acquiring
- **Deployment**: Vercel
- **Monorepo**: Turborepo + npm workspaces

## Project Structure
```
aiag-new/
├── apps/web/           # Next.js frontend
│   ├── src/app/        # App Router pages
│   │   ├── (auth)/     # Login, Register
│   │   ├── (marketing)/ # Marketplace
│   │   ├── api/        # API routes
│   │   ├── dashboard/  # User dashboard
│   │   ├── docs/       # Documentation
│   │   └── pricing/    # Pricing page
│   ├── src/components/ # Reusable components
│   └── src/lib/        # Utilities
├── packages/
│   ├── api-gateway/    # Hono API Gateway
│   ├── database/       # Drizzle ORM schemas
│   ├── tinkoff/        # Tinkoff Acquiring client
│   ├── shared/         # Validation schemas
│   └── typescript-config/ # Shared TS config
└── turbo.json
```

## Key Features
1. AI Model Marketplace with listings
2. User authentication (OAuth + Credentials)
3. Subscription management
4. Pay-per-use billing
5. Tinkoff payment processing with webhooks
6. API Gateway with rate limiting and auth
7. Organization management
8. Contests system
