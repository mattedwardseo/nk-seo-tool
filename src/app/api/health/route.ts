import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  try {
    // Test basic database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Get TimescaleDB version
    const tsVersion = await prisma.$queryRaw<Array<{ extversion: string }>>`
      SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'
    `;

    // Check if audit_metrics is a hypertable
    const hypertables = await prisma.$queryRaw<Array<{ hypertable_name: string }>>`
      SELECT hypertable_name
      FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'audit_metrics'
    `;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timescale_version: tsVersion[0]?.extversion || 'unknown',
      hypertable_configured: hypertables.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
