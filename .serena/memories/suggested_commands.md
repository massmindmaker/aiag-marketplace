# Development Commands

## System Commands (Windows)
- `dir` - List directory contents
- `cd` - Change directory
- `copy` / `xcopy` - Copy files
- `findstr` - Search in files (like grep)
- `where` - Find executable location

## Development
```bash
cd aiag-new
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build all packages
npm run lint         # Run linting
npm run type-check   # TypeScript check
npm run format       # Format with Prettier
```

## Database (Drizzle + Neon)
```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

## Deployment
```bash
npx vercel           # Deploy to preview
npx vercel --prod    # Deploy to production
```

## Individual Packages
```bash
# Run specific package
pnpm --filter @aiag/database db:studio
pnpm --filter web dev
```
