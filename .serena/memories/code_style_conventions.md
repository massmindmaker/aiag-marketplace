# Code Style & Conventions

## TypeScript
- Strict TypeScript enabled
- Use `type` for type aliases, `interface` for extensible contracts
- Export types alongside implementations

## Naming Conventions
- **Files**: kebab-case (`ai-models.ts`)
- **Components**: PascalCase (`ModelCard.tsx`)
- **Variables/Functions**: camelCase
- **Constants**: camelCase or SCREAMING_SNAKE_CASE
- **Database tables**: snake_case (`ai_models`)
- **Types**: PascalCase with descriptive suffixes (`NewUser`, `AiModel`)

## Database (Drizzle)
- Use `pgTable` for table definitions
- Use `$type<T>()` for JSONB fields
- Relations defined separately with `relations()`
- Include proper indexes for query optimization

## React/Next.js
- Use App Router patterns
- Server Components by default
- Client Components when needed ('use client')
- Styled components using MUI's `styled()`
- Separate layout components

## Validation
- Use Zod schemas from `@aiag/shared`
- Compose small schemas into larger ones
- Export both schema and inferred type

## API Gateway
- Middleware-based architecture
- Use Hono's `createMiddleware`
- Throw `HTTPException` for errors
