# Database Migration Guide

This project uses **Atlas** for database migrations and **Kysely** as a query builder.

## Databases

The project uses **two databases**:

| Database     | Purpose                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `kairox`     | **Main/Production** - Contains all application data                    |
| `kairox_dev` | **Migration Validation** - Clean database for Atlas to test migrations |

**Why two databases?**

- Atlas needs a **clean database** to validate migrations work correctly
- Cannot use `kairox` for validation because it has data that would interfere with migration testing

## Environment Variables

All database URLs are centralized in `.env`:

```bash
# .env
DATABASE_URL=postgres://postgres:obimobim@localhost:5432/kairox?search_path=public&sslmode=disable
DEV_DATABASE_URL=postgres://postgres:obimobim@localhost:5432/kairox_dev?search_path=public&sslmode=disable
CORS_ORIGIN=http://localhost:5173
```

**Note**: All scripts use `--env local` which reads both URLs from `atlas.hcl`. No hardcoded URLs anywhere!

## Configuration

- **Atlas config**: `packages/db/atlas.hcl` - Uses `getenv()` for both URLs
- **Database URLs**: Defined in `.env` file (single source of truth)
- **Migration files**: `packages/db/migrations/`
- **Type definitions**: `packages/db/src/generated/types.ts`
- **Source schema**: `packages/db/schema.sql` (pulled from kairox)

## Setup

### Initial Setup (Pull Existing Schema)

Since your `kairox` database already has data, pull the schema:

```bash
bun db:pull-schema
```

This reads `DATABASE_URL` from `.env` and updates `packages/db/schema.sql`.

### Generate Types

```bash
bun db:generate
```

This creates `packages/db/src/generated/types.ts` with TypeScript interfaces for all your tables.

## Workflow

### Updating Schema & Creating Migration

1. **Update `packages/db/schema.sql`** with your schema changes
2. **Generate migration** (requires Docker):

```bash
bun db:migrate describe_your_change
```

This uses `--env local` which reads both `DATABASE_URL` and `DEV_DATABASE_URL` from `atlas.hcl` via `getenv()`.

3. **Review generated SQL** in `packages/db/migrations/TIMESTAMP_describe_your_change.sql`
4. **Apply migration** to main database:

```bash
bun db:migrate:apply
```

5. **Regenerate types**:

```bash
bun db:generate
```

### Quick Declarative Changes

For simple changes without versioned migrations:

```bash
bun db:push
```

This applies schema directly from `schema.sql` to `kairox` database (no migration files).

## Available Commands

| Command                 | Description                                     | Uses                                                  |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `bun db:migrate <name>` | Generate a new migration file                   | `--env local` → reads DATABASE_URL + DEV_DATABASE_URL |
| `bun db:migrate:apply`  | Apply pending migrations to database            | `--env local` → reads DATABASE_URL                    |
| `bun db:generate`       | Generate Kysely types from database schema      | Uses DATABASE_URL                                     |
| `bun db:push`           | Apply schema changes directly (declarative)     | `--env local` → reads DATABASE_URL                    |
| `bun db:studio`         | Generate HCL schema output to terminal          | Uses DATABASE_URL via atlas.hcl                       |
| `bun db:pull-schema`    | Pull current schema from database to schema.sql | Uses DATABASE_URL from .env                           |

**Note**: See `STUDIO.md` for web visualization options.

## Migration Strategies

### Versioned Migrations (Recommended)

**When to use:**

- Production changes
- Need migration history
- Team development
- CI/CD integration

**Workflow:**

```bash
# 1. Edit schema.sql
# 2. Generate migration (uses env vars via atlas.hcl)
bun db:migrate add_feature
# 3. Review migration file
cat packages/db/migrations/*.sql
# 4. Apply migrations to kairox
bun db:migrate:apply
# 5. Regenerate types from kairox
bun db:generate
```

### Declarative (Quick Development)

**When to use:**

- Local development
- Rapid prototyping
- Small changes

**Workflow:**

```bash
# 1. Edit schema.sql
# 2. Push to kairox (uses DATABASE_URL)
bun db:push
# 3. Regenerate types from kairox
bun db:generate
```

## Environment Benefits

✅ **Single Source of Truth**: All URLs defined in `.env`
✅ **No Hardcoded Strings**: Scripts use `--env local` which reads from atlas.hcl
✅ **Easy Updates**: Change DB URL in one place (`.env`)
✅ **CI/CD Ready**: Just set env vars in deployment
✅ **No Duplication**: atlas.hcl uses `getenv()` for both URLs

## Notes

- **Docker Required**: For generating new migrations (uses `DEV_DATABASE_URL` for validation)
- **Dev Database**: `kairox_dev` must be kept clean - Atlas uses it to test migrations
- **Main Database**: `kairox` contains production data
- **SSL Mode**: Disabled for local development
- **Migration History**: Stored in `atlas_schema_revisions` table in kairox

## Troubleshooting

### "connected database is not clean"

When generating migrations, Atlas expects a clean database. Make sure `kairox_dev` is clean:

```bash
# Check if kairox_dev has tables
psql postgres://postgres:obimobim@localhost:5432/kairox_dev?sslmode=disable -c "\dt"
```

If it has tables, you might need to recreate it:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Schema out of sync

If database and schema.sql don't match, pull from kairox:

```bash
bun db:pull-schema
```

Then regenerate types:

```bash
bun db:generate
```

## Migration Strategies

### Versioned Migrations (Recommended)

**When to use:**

- Production changes
- Need migration history
- Team development
- CI/CD integration

**Workflow:**

```bash
# 1. Edit schema.sql
# 2. Generate migration (validates against kairox_dev)
bun db:migrate add_feature
# 3. Review migration file
cat packages/db/migrations/*.sql
# 4. Apply migrations to kairox
bun db:migrate:apply
# 5. Regenerate types from kairox
bun db:generate
```

### Declarative (Quick Development)

**When to use:**

- Local development
- Rapid prototyping
- Small changes

**Workflow:**

```bash
# 1. Edit schema.sql
# 2. Push to kairox
bun db:push
# 3. Regenerate types from kairox
bun db:generate
```

## Notes

- **Docker Required**: For generating new migrations (uses kairox_dev for validation)
- **Dev Database**: `kairox_dev` must be kept clean - Atlas uses it to test migrations
- **Main Database**: `kairox` contains your production data
- **SSL Mode**: Disabled for local development
- **Always Sync**: Regenerate types after any schema changes
- **Migration History**: Stored in `atlas_schema_revisions` table in kairox

## Troubleshooting

### "connected database is not clean"

When generating migrations, Atlas expects a clean database. Make sure `kairox_dev` is clean:

```bash
# Check if kairox_dev has tables
psql postgres://postgres:obimobim@localhost:5432/kairox_dev?sslmode=disable -c "\dt"
```

If it has tables, you might need to recreate it:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Schema out of sync

If database and schema.sql don't match, pull from kairox:

```bash
bun db:pull-schema
```

Then regenerate types:

```bash
bun db:generate
```
