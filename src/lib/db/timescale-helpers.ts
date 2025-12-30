import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Get aggregated metrics using TimescaleDB's time_bucket function
 * Groups data into time intervals for efficient analysis
 */
export async function getMetricsTimeBucket(
  auditId: string,
  bucketInterval: string = '1 hour',
  timeRange: string = '24 hours'
): Promise<
  Array<{
    bucket: Date
    metric_name: string
    avg_value: number
    count: bigint
  }>
> {
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
  `
}

/**
 * Insert multiple metrics at once for a given audit
 * Uses Prisma's createMany for efficient batch inserts
 */
export async function insertMetricsBatch(
  auditId: string,
  metrics: Array<{
    metricName: string
    metricValue: number
    metadata?: Prisma.InputJsonValue
  }>
): Promise<{ count: number }> {
  const recordedAt = new Date()

  const data: Prisma.audit_metricsCreateManyInput[] = metrics.map((m) => ({
    audit_id: auditId,
    metric_name: m.metricName,
    metric_value: m.metricValue,
    recorded_at: recordedAt,
    metadata: m.metadata,
  }))

  return await prisma.audit_metrics.createMany({ data })
}

/**
 * Get the most recent metrics for an audit
 */
export async function getLatestMetrics(
  auditId: string,
  limit: number = 100
): Promise<
  Array<{
    id: number
    metricName: string
    metricValue: number | null
    recordedAt: Date
  }>
> {
  const metrics = await prisma.audit_metrics.findMany({
    where: { audit_id: auditId },
    orderBy: { recorded_at: 'desc' },
    take: limit,
    select: {
      id: true,
      metric_name: true,
      metric_value: true,
      recorded_at: true,
    },
  })

  return metrics.map((m) => ({
    id: m.id,
    metricName: m.metric_name,
    metricValue: m.metric_value ? Number(m.metric_value) : null,
    recordedAt: m.recorded_at,
  }))
}

/**
 * Get time range statistics for an audit
 */
export async function getAuditMetricsStats(auditId: string): Promise<{
  totalMetrics: number
  firstRecorded: Date | null
  lastRecorded: Date | null
}> {
  const stats = await prisma.$queryRaw<
    Array<{
      total: bigint
      first_recorded: Date | null
      last_recorded: Date | null
    }>
  >`
    SELECT
      COUNT(*) as total,
      MIN(recorded_at) as first_recorded,
      MAX(recorded_at) as last_recorded
    FROM audit_metrics
    WHERE audit_id = ${auditId};
  `

  return {
    totalMetrics: Number(stats[0]?.total || 0),
    firstRecorded: stats[0]?.first_recorded || null,
    lastRecorded: stats[0]?.last_recorded || null,
  }
}
