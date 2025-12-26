# AGENTS.md

This file guides agentic coding assistants working in this repository.

## Commands

### Development
- `bun check` - Runs oxlint (type-aware) and oxfmt (format)
- `bun build` - Builds all packages using Turbo
- `bun check-types` - Type checks all packages
- `bun dev` - Runs all dev servers (web, server)
- `bun dev:web` - Runs web app dev server only
- `bun dev:server` - Runs server dev server only

### Database
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Drizzle Studio
- `bun db:generate` - Generate Drizzle client
- `bun db:migrate` - Run database migrations

### Running Single Package Commands
Use Turbo to run scripts in specific packages:
- `bun turbo -F <package-name> <script>`
- Example: `bun turbo -F web check-types`

### Testing
This repository does not currently have test files.

## Code Style Guidelines

### Imports
Order: Third-party packages → Workspace packages (@kairox/*) → Local aliases (@ui/*, @/*, @icons/*)

```typescript
import { useState } from 'react';
import { Button } from '@ui/button';
import { TextField } from '@/components/form-factory';
import { cn } from '@/lib/utils';
```

Use named imports from workspace packages:
```typescript
import { auth } from '@kairox/auth';
import { appRouter } from '@kairox/api/routers/index';
```

### Formatting (oxfmt)
- Use tabs for indentation (`useTabs: true`)
- Max line width: 100 characters
- Single quotes for strings
- Semicolons required
- Arrow functions with single parameter: `(param) => ...`
- No trailing commas in function calls

### Types
- All files use TypeScript with `strict: true`
- Export types separately: `export type { AppRouter }`
- Derive types from values: `export type AppRouter = typeof appRouter`
- Component props: Use `React.ComponentProps<typeof Component>` or interfaces
- Use `zod` for runtime validation

### Component Patterns
- Files: kebab-case (`theme-provider.tsx`, `social-auth-buttons.tsx`)
- Components: PascalCase (`TextField`, `SocialAuthButtons`)
- Functions/Variables: camelCase (`createContext`, `queryClient`)
- Constants: UPPER_SNAKE_CASE (`DATABASE_URL`, `CORS_ORIGIN`)

### React Components
- Create wrapper components for third-party libraries:
```typescript
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```
- Props pattern: Destructure custom props first, then spread rest:
```typescript
function Component({ className, variant, ...props }: Props) {
  return <div className={cn(className)} {...props} />;
}
```
- Utility function for className merging: `cn(...)` from `@/lib/utils`

### Complex Components (Compound Pattern)
Use compound components for complex UIs with multiple configuration options. Avoid monolithic components with 20+ props.

**When to use:**
- Components with many configuration options
- Multiple distinct UI areas composed differently
- Optional or conditionally rendered functionality
- Components used across the app in various configurations

**Implementation pattern:**
```typescript
// Context for sharing state between compound components
interface CardContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  variant: 'default' | 'outline';
  size: 'default' | 'sm';
}
const CardContext = createContext<CardContextValue | null>(null);
const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) throw new Error('Card components must be used within Card.Root');
  return context;
};

// Root component manages shared state
function CardRoot({ children, variant, size, ...props }: CardRootProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <CardContext.Provider value={{ isCollapsed, setIsCollapsed, variant, size }}>
      <div className={cn(/* base styles */)} {...props}>{children}</div>
    </CardContext.Provider>
  );
}

// Child components access context
function CardHeader({ children, className }: CardHeaderProps) {
  const { isCollapsed } = useCardContext();
  return <div className={cn(className)}>{children}</div>;
}

// Export as compound object
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
} as const;
```

**Advanced patterns:**
- Split contexts (StateContext vs ConfigContext) to prevent unnecessary re-renders
- Memoize context values: `useMemo(() => ({ isCollapsed }), [isCollapsed])`
- Smart defaults: automatically determine behavior based on content
- Type safety: `export const Card: CardComponent = { Root, Header } as const`

**Usage:**
```typescript
<Card.Root collapsible size="lg">
  <Card.Header>
    <Card.Title>Dashboard</Card.Title>
  </Card.Header>
  <Card.Content>{/* content */}</Card.Content>
</Card.Root>
```

### API/Backend
- Use ORPC for RPC endpoints
- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints (throws `ORPCError("UNAUTHORIZED")` if no session)
- Pass typed context to procedures
- Use `@orpc/experimental-pino` for logging with pino
- Use better-auth for authentication

### Error Handling
- API errors: Use `ORPCError` with appropriate codes ("UNAUTHORIZED", etc.)
- Logging: Use pino logger via `@orpc/experimental-pino` plugin
- Async operations: Use try/catch where appropriate
- Use `void` for fire-and-forget async calls: `void form.handleSubmit()`

### File Structure
```
apps/
  web/src/
    components/     # Reusable React components
    hooks/          # Custom React hooks
    lib/            # Utility functions
    routes/         # TanStack Router route files
    styles/         # CSS files
packages/
  api/             # Backend API routes and context
  auth/            # Authentication setup
  db/              # Database schema and client
  schema/          # Shared Zod schemas
```

### State Management
- Server state: TanStack Query (via @orpc/tanstack-query)
- Routing: TanStack Router
- Forms: TanStack Form

### Utility Functions
- Merge classNames with `cn()` from `@/lib/utils`
- Use `remember()` for singleton patterns (database connection, etc.)

### Environment Variables
- Loaded via dotenv in server entry point
- Use `process.env.VARIABLE_NAME`
- Database URL: `process.env.DATABASE_URL`
- CORS origin: `process.env.CORS_ORIGIN`

### Monorepo
- Uses Turborepo for task orchestration
- Uses Bun workspace catalog for dependency management
- Package scope: `@kairox/*`

### UI Components
- Base UI primitives from `@base-ui/react`
- Components in `@ui/*` alias for `@/components/ui/*`
- Variants using class-variance-authority (cva)
- Icons imported as SVG files from `@icons/*` alias
