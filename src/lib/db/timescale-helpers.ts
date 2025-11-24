import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Get aggregated metrics using TimescaleDB's time_bucket function
 * Groups data into time intervals for efficient analysis
 */
export async function getMetricsTimeBucket(
  auditId: string,
  bucketInterval: string = '1 hour',
  timeRange: string = '24 hours'
): Promise<Array<{
  bucket: Date;
  metric_name: string;
  avg_value: number;
  count: bigint;
}>> {
  return await prisma.$queryRaw`
    SELECT
      time_bucket(${bucketInterval}::interval, recorded_at) as bucket,
      metric_name,
      AVG(metric_value::numeric) as avg_value,
      COUNT(*) as count
    FROM audit_metrics
    WHERE audit_id = ${auditId}
      AND recorded_at > NOW() - ${timeRange}::interval
    GROUP BY bucket, metric_name
    ORDER BY bucket DESC, metric_name;
  `;
}

/**
 * Insert multiple metrics at once for a given audit
 * Uses Prisma's createMany for efficient batch inserts
 */
export async function insertMetricsBatch(
  auditId: string,
  metrics: Array<{
    metricName: string;
    metricValue: number;
    metadata?: Prisma.InputJsonValue;
  }>
): Promise<{ count: number }> {
  const recordedAt = new Date();

  const data: Prisma.AuditMetricCreateManyInput[] = metrics.map(m => ({
    auditId,
    metricName: m.metricName,
    metricValue: m.metricValue,
    recordedAt,
    metadata: m.metadata,
  }));

  return await prisma.auditMetric.createMany({ data });
}

/**
 * Get the most recent metrics for an audit
 */
export async function getLatestMetrics(
  auditId: string,
  limit: number = 100
): Promise<Array<{
  id: number;
  metricName: string;
  metricValue: number | null;
  recordedAt: Date;
}>> {
  const metrics = await prisma.auditMetric.findMany({
    where: { auditId },
    orderBy: { recordedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      metricName: true,
      metricValue: true,
      recordedAt: true,
    },
  });

  return metrics.map(m => ({
    ...m,
    metricValue: m.metricValue ? Number(m.metricValue) : null,
  }));
}

/**
 * Get time range statistics for an audit
 */
export async function getAuditMetricsStats(
  auditId: string
): Promise<{
  totalMetrics: number;
  firstRecorded: Date | null;
  lastRecorded: Date | null;
}> {
  const stats = await prisma.$queryRaw<Array<{
    total: bigint;
    first_recorded: Date | null;
    last_recorded: Date | null;
  }>>`
    SELECT
      COUNT(*) as total,
      MIN(recorded_at) as first_recorded,
      MAX(recorded_at) as last_recorded
    FROM audit_metrics
    WHERE audit_id = ${auditId};
  `;

  return {
    totalMetrics: Number(stats[0]?.total || 0),
    firstRecorded: stats[0]?.first_recorded || null,
    lastRecorded: stats[0]?.last_recorded || null,
  };
}
