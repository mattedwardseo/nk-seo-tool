# Project Blockers & Issues

## Active Blockers

None currently

---

## Resolved Blockers

### BLOCKER-001: Hypertable Creation Error ✅ RESOLVED

**Status**: Resolved
**Severity**: Critical
**Reported**: 2025-11-24
**Resolved**: 2025-11-24

**Description**:
Error "relation audit_metrics does not exist" when attempting to create TimescaleDB hypertable.

**Root Cause**:
Attempted to create hypertable in same migration that created the table. TimescaleDB requires table to exist before conversion.

**Impact**:
Blocked all database operations and application development.

**Resolution**:
Implemented two-phase migration strategy:

1. First migration creates tables only
2. Verify tables exist with verification script
3. Second migration converts to hypertable
4. Verify hypertable with verification script

**Prevention**:

- Always use two separate migrations for TimescaleDB hypertables
- Run verification scripts between migrations
- Document this pattern in ADR-001

---

### BLOCKER-002: Hypertable Unique Constraint Error ✅ RESOLVED

**Status**: Resolved
**Severity**: Critical
**Reported**: 2025-11-24
**Resolved**: 2025-11-24

**Description**:
Error "cannot create a unique index without the column 'recorded_at' (used in partitioning)" when creating hypertable.

**Root Cause**:
TimescaleDB requires that all unique constraints (including primary keys) include the partitioning column.

**Impact**:
Blocked hypertable creation.

**Resolution**:
Modified migration to change primary key:

```sql
ALTER TABLE audit_metrics DROP CONSTRAINT audit_metrics_pkey;
ALTER TABLE audit_metrics ADD PRIMARY KEY (id, recorded_at);
```

**Prevention**:

- Always plan for composite primary keys when using TimescaleDB
- Document this pattern in ADR-003

---

### BLOCKER-003: TimescaleDB Compression Policy Failed ✅ RESOLVED (WORKAROUND)

**Status**: Resolved with workaround
**Severity**: Medium
**Reported**: 2025-11-24
**Resolved**: 2025-11-24

**Description**:
Error "functionality not supported under the current 'apache' license" when adding compression policy.

**Root Cause**:
Neon's TimescaleDB uses Apache license which doesn't include compression, retention, or continuous aggregates.

**Impact**:
Cannot use automatic data compression or retention policies.

**Resolution**:
Removed compression and retention policies from migration. Documented as known limitation.

**Workarounds**:

1. Implement manual cleanup via scheduled jobs (Inngest)
2. Migrate to Timescale Cloud for production
3. Use self-hosted TimescaleDB with Timescale License

**Prevention**:

- Check license features before planning TimescaleDB features
- Document limitations in CLAUDE.md and ADR-004

---

### BLOCKER-004: Prisma 7 Configuration Changes ✅ RESOLVED

**Status**: Resolved
**Severity**: Medium
**Reported**: 2025-11-24
**Resolved**: 2025-11-24

**Description**:
Prisma 7 removed `url` and `directUrl` from schema.prisma, requiring prisma.config.ts instead.

**Root Cause**:
Breaking change in Prisma 7.0.0.

**Impact**:
Migration commands failed with configuration errors.

**Resolution**:
Downgraded to Prisma 6.19.0 which supports traditional schema.prisma configuration.

**Prevention**:

- Pin dependency versions in package.json
- Check for breaking changes before major version upgrades

---

## Template for New Blockers

### BLOCKER-XXX: [Short Description]

**Status**: 🔴 Active | 🟡 In Progress | 🟢 Resolved
**Severity**: Critical | High | Medium | Low
**Reported**: YYYY-MM-DD
**Resolved**: YYYY-MM-DD (if resolved)

**Description**:
[Detailed description of the issue]

**Root Cause**:
[What's causing the problem]

**Impact**:
[What this blocks or affects]

**Resolution**:
[How it was fixed, or current attempts]

**Prevention**:
[How to avoid this in the future]
