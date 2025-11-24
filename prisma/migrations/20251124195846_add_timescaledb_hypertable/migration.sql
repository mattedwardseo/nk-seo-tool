-- Enable TimescaleDB extension (idempotent)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Verify extension loaded
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
  ) THEN
    RAISE EXCEPTION 'TimescaleDB extension not available';
  END IF;
END $$;

-- TimescaleDB requires unique constraints to include the partitioning column
-- Drop the existing primary key and create a composite one
ALTER TABLE audit_metrics DROP CONSTRAINT audit_metrics_pkey;

-- Create a new composite primary key including the time column
ALTER TABLE audit_metrics ADD PRIMARY KEY (id, recorded_at);

-- Convert audit_metrics to hypertable
-- CRITICAL: Table MUST exist before this runs
SELECT create_hypertable(
  'audit_metrics',
  'recorded_at',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Verify hypertable created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'audit_metrics'
  ) THEN
    RAISE EXCEPTION 'Failed to create hypertable for audit_metrics';
  END IF;
END $$;

-- NOTE: Compression and retention policies require Timescale License (not Apache)
-- These features are not available on Neon's TimescaleDB Apache edition
-- If you need these features, consider:
-- 1. Timescale Cloud (https://timescale.com/)
-- 2. Self-hosted TimescaleDB with Timescale License
-- 3. Manual data cleanup via scheduled jobs
