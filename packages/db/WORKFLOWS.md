# Database Migration Strategies

## Declarative (`db:push`)

**What**: Apply schema directly from source of truth (`schema.sql`)

**Pros**:

- Simple: edit schema.sql → run push
- No migration files to manage
- Fast for small changes

**Cons**:

- No version history
- Can't see what changed when
- Harder to track changes
- No rollback capability

**Use when**:

- Local development
- Small projects
- Rapid prototyping

---

## Versioned (`db:migrate` + `db:migrate:apply`)

**What**: Generate and apply SQL migration files

**Pros**:

- Full version history
- Can review changes before applying
- Rollback capability
- Team collaboration
- CI/CD friendly

**Cons**:

- More steps (generate → review → apply)
- Need to manage migration files
- Requires Docker for proper `--dev-url`

**Use when**:

- Production
- Team development
- Need migration history
- Want rollbacks
- CI/CD integration

---

## Recommended Workflow

### Development

```bash
# Edit schema.sql
# Quick apply (declarative)
bun db:push
# Regenerate types
bun db:generate
```

### Production

```bash
# 1. Edit schema.sql
# 2. Generate migration
bun db:migrate add_new_feature
# 3. Review migrations in packages/db/migrations/
# 4. Apply migrations (in CI/CD)
bun db:migrate:apply
# 5. Regenerate types
bun db:generate
```
