# Architecture Decision Records (ADRs)

## ADR-001: Two-Phase Database Migration Strategy

**Date**: 2025-11-24
**Status**: Accepted

**Context**: TimescaleDB requires tables to exist before converting to hypertables. Single-migration approach causes "relation does not exist" error.

**Decision**: Use two separate Prisma migrations:

1. First migration: Create all standard tables
2. Second migration: Convert audit_metrics to hypertable

**Consequences**:

- ✅ Avoids "relation does not exist" error
- ✅ Verification checkpoint between table and hypertable creation
- ⚠️ Requires manual SQL editing for hypertable migration
- ⚠️ More complex than single-migration approach

---

## ADR-002: Pooled vs Unpooled Database Connections

**Date**: 2025-11-24
**Status**: Accepted

**Context**: Neon provides both pooled and unpooled connection URLs. Migrations can fail with pooled connections.

**Decision**:

- Use `DATABASE_URL` (unpooled) for Prisma migrations
- Use `DATABASE_URL_POOLED` for application runtime

**Consequences**:

- ✅ Migrations work reliably without connection pool issues
- ✅ Better runtime performance with connection pooling
- ⚠️ Must manage two connection strings in environment

---

## ADR-003: Composite Primary Key for Hypertable

**Date**: 2025-11-24
**Status**: Accepted

**Context**: TimescaleDB requires unique constraints to include the partitioning column (recorded_at). Standard auto-increment primary key causes "cannot create a unique index without the column 'recorded_at'" error.

**Decision**: Change `audit_metrics` primary key from `(id)` to `(id, recorded_at)`.

**Implementation**:

```sql
ALTER TABLE audit_metrics DROP CONSTRAINT audit_metrics_pkey;
ALTER TABLE audit_metrics ADD PRIMARY KEY (id, recorded_at);
```

**Consequences**:

- ✅ Enables hypertable creation
- ✅ Maintains uniqueness guarantees
- ⚠️ Foreign key references must be updated if needed
- ⚠️ Lookups by `id` alone may be slower (need to scan across time partitions)

---

## ADR-004: TimescaleDB Apache License Limitations

**Date**: 2025-11-24
**Status**: Accepted

**Context**: Neon's TimescaleDB uses Apache license which doesn't support compression policies, retention policies, or continuous aggregates.

**Decision**: Accept limitations for Phase 1, implement manual data cleanup if needed.

**Alternatives Considered**:

1. Timescale Cloud (commercial)
2. Self-hosted with Timescale License
3. Manual scheduled cleanup jobs

**Consequences**:

- ✅ Zero additional cost
- ✅ Basic hypertable functionality works
- ⚠️ No automatic compression (higher storage costs)
- ⚠️ No automatic retention (manual cleanup required)
- ⚠️ Consider migration to Timescale Cloud for production scale

---

## ADR-005: Next.js App Router over Pages Router

**Date**: 2025-11-24
**Status**: Accepted

**Context**: Next.js 16 supports both App Router and Pages Router.

**Decision**: Use App Router exclusively.

**Rationale**:

- React Server Components by default
- Better data fetching patterns
- Improved TypeScript integration
- Future-proof (Pages Router in maintenance mode)

**Consequences**:

- ✅ Better performance with RSC
- ✅ Simplified data fetching
- ⚠️ Different patterns from older Next.js projects
- ⚠️ Some third-party packages may not be compatible

---

## ADR-006: Prisma ORM over Raw SQL

**Date**: 2025-11-24
**Status**: Accepted with Exception

**Context**: Need type-safe database access while supporting TimescaleDB-specific features.

**Decision**:

- Use Prisma for standard CRUD operations
- Use raw SQL (`$queryRaw`) for TimescaleDB-specific queries (time_bucket, etc.)

**Consequences**:

- ✅ Type safety for most database operations
- ✅ Automatic migrations
- ✅ Excellent TypeScript integration
- ⚠️ Raw SQL queries for advanced TimescaleDB features
- ⚠️ Manual type annotations needed for raw queries
