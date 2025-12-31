# Better Auth Database Configuration

## Current Implementation (Issues Fixed)

Based on the Better Auth documentation, I've corrected the auth configuration:

```typescript
// packages/auth/src/index.ts
import { db } from '@kairox/db';
import * as schema from '@kairox/db/schema/index';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema, // Shared schema from @kairox/db
	}),
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 2 * 60,
		},
	},
	trustedOrigins: ['http://localhost:3001', 'http://172.20.10.3:3001'],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: process.env.NODE_ENV === 'production',
		password: {
			hash: (password) => Bun.password.hash(password),
			verify: (data) => Bun.password.verify(data.password, data.hash),
		},
	},
	advanced: {
		database: {
			generateId: () => Bun.randomUUIDv7(),
		},
		defaultCookieAttributes: {
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			secure: process.env.NODE_ENV === 'production',
			httpOnly: process.env.NODE_ENV === 'production',
		},
	},
});
```

## What Was Incorrect (Removed):

### ❌ `transform: 'camelCase'` Option

```typescript
// WRONG - This is for Drizzle adapter only
advanced: {
	database: {
		transform: 'camelCase', // ❌ Remove this
	},
},
```

**Why this is wrong:**

- The `transform: 'camelCase'` is a **Drizzle adapter-specific option**
- It's only needed when using raw Drizzle, not the Better Auth wrapper
- Kysely doesn't need this option - it works fine with Postgres columns directly
- Better Auth's built-in Kysely adapter already handles column naming properly

### ✅ Kysely Joins Work Fine (No Special Config Needed)

**From Better Auth docs:**

> Better Auth also works without any database.

**For Kysely:**

- Kysely is a **query builder**, not an ORM with join logic
- Joins work perfectly fine in PostgreSQL using standard JOIN syntax
- No special configuration needed
- Column names work as defined in the database (snake_case or camel_case)

### ✅ Use Shared Database Instance (Already Doing This)

```typescript
// packages/auth/src/index.ts
import { db } from '@kairox/db'; // ✅ Uses shared Kysely instance

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema, // Shared schema from @kairox/db/schema/index
	}),
	// ... rest of config
});
```

## How Joins Work in Kysely

Kysely doesn't need special configuration for joins. Here's how they work:

### Example: User with Account

```typescript
import { db } from '@kairox/db';

// Join user with their account
const userWithAccount = await db
	.selectFrom('user')
	.innerJoin('account', 'userId', 'user.id')
	.selectAll();

// Resulting SQL:
// SELECT * FROM user
// INNER JOIN account ON account.user_id = user.id
```

### Example: Event with Tickets and Order Items

```typescript
const eventWithDetails = await db
	.selectFrom('event')
	.innerJoin('ticket_type', 'eventId', 'event.id')
	.innerJoin('order_item', 'ticketTypeId', 'ticket_type.id')
	.selectAll();
```

## Alternative: Using Direct Kysely (If Needed)

If you ever need to bypass Better Auth's database adapter:

```typescript
// Instead of using Better Auth's database:
export const auth = betterAuth({
	database: { /* Better Auth adapter */ },
});

// Use Kysely directly for complex queries:
import { Kysely, PostgresDialect } from 'kysely';

const kyselyDb = new Kysely<Database>({
	dialect: new PostgresDialect({ pool: new Pool({ connectionString: process.env.DATABASE_URL }) }),
});

// Can use both instances
const authData = await db.selectFrom('user').where('id', '=', userId).executeFirst();
const complexJoin = await kyselyDb
	.selectFrom('event')
	.innerJoin('ticket_type', 'eventId', 'event.id')
	.selectAll();
```

## Benefits of Current Setup

✅ **Shared database** - Single Kysely instance across all packages
✅ **Shared schema** - Database structure defined once in `@kairox/db`
✅ **Drizzle adapter** - Proper TypeScript types from schema
✅ **UUID generation** - Uses `Bun.randomUUIDv7()` from database config
✅ **No duplicate connections** - One database pool for all operations

## References

- [Better Auth Database Docs](https://www.better-auth.com/docs/concepts/database)
- [Better Auth Drizzle Adapter](https://www.better-auth.com/docs/adapters/drizzle)
- [Kysely Joins Documentation](https://kysely.dev/docs/recipes/relations)
- [Better Auth Built-in Adapters](https://www.better-auth.com/docs/concepts/database#adapters)
