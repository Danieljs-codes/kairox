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

Order: Third-party packages → Workspace packages (@kairox/_) → Local aliases (@ui/_, @/_, @icons/_)

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
- **Prefer type inference** over explicit return type annotations:

  ```typescript
  // ✅ Good - Let TS infer
  async function getEvent(id: number) {
    return Result.fromAsyncCatching(...);
  }

  // ❌ Bad - Explicit type annotation
  async function getEvent(id: number): AsyncResult<Event, Error> {
    return Result.fromAsyncCatching(...);
  }
  ```

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

### API/Backend Architecture

**Feature-Based Structure**: Organize backend code by feature, not by layer. Each feature is self-contained with its own router, service, and errors.

**Directory Structure:**

```
packages/api/src/
  features/
    events/
      events.router.ts    # ORPC procedures for events
      events.service.ts   # Business logic & DB operations
      events.errors.ts    # Feature-specific error classes
    tickets/
      tickets.router.ts
      tickets.service.ts
      tickets.errors.ts
  routers/
    index.ts             # Combine all feature routers
```

**Dependency Injection Pattern**: Services are functions that accept dependencies as arguments rather than importing them directly. This improves testability and makes dependencies explicit.

```typescript
// events.service.ts
import type { Database } from '@kairox/db';

export async function getEvent(db: Database, id: number) {
  return Result.fromAsyncCatching(
    () => db.query.events.findFirst({ where: eq(events.id, id) }),
    (error) => new DatabaseError("Failed to fetch event", { cause: error })
  );
}

export async function createEvent(db: Database, data: CreateEventInput) {
  return Result.fromAsyncCatching(
    () => db.insert(events).values(data).returning(),
    (error) => new DatabaseError("Failed to create event", { cause: error })
  );
}
```

**Router Pattern**: Routers call service functions with injected dependencies from context.

```typescript
// events.router.ts
import { getEvent } from './events.service';

export const eventsRouter = {
  getEvent: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const result = await getEvent(context.db, input.id);

      if (!result.ok) {
        return result.match()
          .when(DatabaseError, () => { throw new ORPCError("INTERNAL_SERVER_ERROR"); })
          .when(NotFoundError, () => { throw new ORPCError("NOT_FOUND"); })
          .run();
      }

      return result.value;
    }),
};
```

**Error Definition**: Each feature defines its own error classes.

```typescript
// events.errors.ts
export class EventNotFoundError extends Error {
  constructor(eventId: number) {
    super(`Event with ID ${eventId} not found`);
    this.name = 'EventNotFoundError';
  }
}

export class EventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventValidationError';
  }
}
```

**General Backend Guidelines:**

- Use ORPC for RPC endpoints
- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints (throws `ORPCError("UNAUTHORIZED")` if no session)
- Pass typed context to procedures
- Use `@orpc/experimental-pino` for logging with pino
- Use better-auth for authentication
- Services communicate with the database directly (no repository layer)
- Keep service functions pure and focused on business logic

### Error Handling

- **Use TypeScript Result for all service operations**: All functions that can fail must return `Result<T, E>` or `AsyncResult<T, E>`
- Install: `bun add typescript-result`
- Import: `import { Result } from 'typescript-result'`

#### TypeScript Result Patterns

**Common methods (80% of usage):**

1. **`Result.try()` / `Result.fromAsyncCatching()`** - Wrap operations that might throw

```typescript
// Database operations
async function getEvent(id: number) {
  return Result.fromAsyncCatching(
    () => db.query.events.findFirst({ where: eq(events.id, id) }),
    (error) => new DatabaseError("Failed to fetch event", { cause: error })
  );
}

// External APIs
async function sendEmail(to: string) {
  return Result.fromAsyncCatching(
    () => emailService.send({ to, template: "welcome" }),
    (error) => new EmailError("Failed to send email", { cause: error })
  );
}
```

2. **`Result.ok()` / `Result.error()`** - Return from business logic

```typescript
async function createEvent(data: CreateEventInput) {
  if (data.name.length < 3) {
    return Result.error(new ValidationError("Event name too short"));
  }

  const event = await db.insert(events).values(data).returning();
  return Result.ok(event);
}
```

3. **`.map()`** - Transform success values

```typescript
async function getEventDetails(eventId: number) {
  return getEvent(eventId).map((event) => ({
    id: event.id,
    name: event.name,
    venue: { id: event.venueId, name: event.venueName }
  }));
}
```

4. **`.match()`** - Handle errors at API boundary

```typescript
getEvent: publicProcedure.handler(async ({ input }) => {
  const result = await getEvent(input.id);

  if (!result.ok) {
    return result.match()
      .when(DatabaseError, () => { throw new ORPCError("INTERNAL_SERVER_ERROR"); })
      .when(ValidationError, () => { throw new ORPCError("BAD_REQUEST"); })
      .when(NotFoundError, () => { throw new ORPCError("NOT_FOUND"); })
      .run();
  }

  return result.value;
})
```

5. **`Result.all()`** - Combine independent operations

```typescript
async function getEventDashboard(eventId: number) {
  return Result.all(
    getEvent(eventId),
    getEventTickets(eventId),
    getEventAttendees(eventId)
  ).map(([event, tickets, attendees]) => ({
    event,
    ticketCount: tickets.length,
    attendeeCount: attendees.length
  }));
}
```

#### Class Methods with Result

```typescript
class EventService {
  async getEvent(id: number): AsyncResult<Event, Error> {
    return Result.fromAsyncCatching(
      () => this.db.query.events.findFirst({ where: eq(events.id, id) }),
      (error) => new DatabaseError("Query failed", { cause: error })
    );
  }

  validateName(name: string): Result<string, ValidationError> {
    return Result.try(() => {
      if (name.length < 3) throw new ValidationError("Name too short");
      return name.trim();
    });
  }
}
```

#### Result.gen() for Complex Workflows

```typescript
function* bookingWorkflow(eventId: number, userId: number) {
  const event = yield* getEvent(eventId);
  const user = yield* getUser(userId);
  const ticket = yield* createTicket(eventId, userId);
  return ticket;
}

// Execute with Result.gen()
const result = Result.gen(bookingWorkflow(123, 456));
```

**When to use:**

- 3+ sequential operations with dependencies
- Want clean top-to-bottom flow (avoids nested .map())
- Early exit on first error

**When NOT to use:**

- Single transformation (use `.map()`)
- Independent operations (use `Result.all()`)
- Side effects only (use `.onSuccess()`)

#### Error Conversion in Procedures

Convert domain errors to ORPCError at the procedure boundary:

```typescript
createTicket: protectedProcedure.handler(async ({ context, input }) => {
  const result = await createTicket(input.eventId, context.session.user.id);

  if (!result.ok) {
    return result.match()
      .when(ValidationError, (error) => {
        throw new ORPCError("BAD_REQUEST", error.message);
      })
      .when(EventFullError, (error) => {
        throw new ORPCError("CONFLICT", "Event is fully booked");
      })
      .when(DatabaseError, () => {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      })
      .run();
  }

  return result.value;
})
```

- Logging: Use pino logger via `@orpc/experimental-pino` plugin
- Use `.onSuccess()` / `.onFailure()` for side effects (logging, metrics):

```typescript
createEvent(data)
  .onSuccess((event) => logger.info(`Event created: ${event.id}`))
  .onFailure((error) => logger.error("Event creation failed", error))
```

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
