# Task Completion Checklist

## Before Completing Any Task

1. **TypeScript Check**
   ```bash
   npm run type-check
   ```

2. **Linting**
   ```bash
   npm run lint
   ```

3. **Format Code**
   ```bash
   npm run format
   ```

4. **Build Test**
   ```bash
   npm run build
   ```

## Database Changes
- Run `npm run db:generate` after schema changes
- Review generated migration
- Test with `npm run db:push` (dev) or `npm run db:migrate` (prod)

## Frontend Changes
- Test in dev mode (`npm run dev`)
- Check responsive design
- Verify dark/light theme consistency

## API Changes
- Test endpoints manually
- Verify auth/permissions
- Check rate limiting behavior

## Before Committing
- Review all changed files
- Ensure no secrets/credentials committed
- Write descriptive commit message
