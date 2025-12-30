/**
 * Local SEO Inngest Functions
 *
 * Background jobs for grid scanning, competitor aggregation, and GBP refresh.
 */

import { inngest } from '@/lib/inngest'
import {
  generateGridPoints,
  scanGridForAllKeywords,
  aggregateCompetitorStats,
  calculateRankChanges,
  estimateScanCost,
} from '@/lib/local-seo'
import type { KeywordScanResult } from '@/lib/local-seo/types'
import type { BusinessInfoResult } from '@/lib/dataforseo/schemas/business'
import {
  getLocalCampaign,
  createGridScan,
  startGridScan,
  updateScanProgress,
  completeGridScan,
  failGridScan,
  saveGridPointResults,
  saveCompetitorStats,
  updateCampaignSchedule,
  getPreviousCompetitorStats,
  saveGBPSnapshot,
  getCampaignsDueForScan,
} from '@/lib/db/local-campaign-operations'
import { BusinessModule } from '@/lib/dataforseo/modules/business'
import { getDataForSEOClient } from '@/lib/dataforseo'

/**
 * Main grid scan orchestrator
 *
 * Coordinates the full scan process:
 * 1. Create scan record
 * 2. Generate grid points
 * 3. Scan all keywords across all points
 * 4. Aggregate competitor stats
 * 5. Save results and update campaign
 */
export const runGridScan = inngest.createFunction(
  {
    id: 'local-seo-grid-scan',
    retries: 2,
    concurrency: {
      limit: 5, // Max 5 concurrent scans
    },
  },
  { event: 'local-seo/scan.requested' },
  async ({ event, step }) => {
    const { campaignId, userId, keywords: requestedKeywords } = event.data
    let scanId: string | null = null

    try {
      // Step 1: Get campaign and validate
      const campaign = await step.run('get-campaign', async () => {
        const c = await getLocalCampaign(campaignId)
        if (!c) throw new Error(`Campaign not found: ${campaignId}`)
        if (c.user_id !== userId) throw new Error('Unauthorized')
        return c
      })

      // Step 2: Create scan record
      scanId = await step.run('create-scan', async () => {
        return createGridScan(campaignId)
      })

      // Step 3: Start scan
      await step.run('start-scan', async () => {
        await startGridScan(scanId!)
      })

      // Step 4: Generate grid points
      const gridPoints = await step.run('generate-grid', async () => {
        return generateGridPoints({
          centerLat: Number(campaign.center_lat),
          centerLng: Number(campaign.center_lng),
          gridSize: campaign.grid_size,
          radiusMiles: Number(campaign.grid_radius_miles),
        })
      })

      // Determine keywords to scan
      const keywords = requestedKeywords ?? campaign.keywords
      if (keywords.length === 0) {
        throw new Error('No keywords to scan')
      }

      // Calculate expected cost
      const costEstimate = estimateScanCost(campaign.grid_size, keywords.length)

      // Step 5: Scan all keywords
      const scanResults = await step.run('scan-keywords', async () => {
        let totalPointsCompleted = 0
        const totalPoints = gridPoints.length * keywords.length

        const results = await scanGridForAllKeywords(
          gridPoints,
          keywords,
          {
            targetBusinessName: campaign.business_name,
            depth: 20,
            skipCache: true, // Always fresh data for scans
          },
          async (_keyword, keywordIndex, _totalKeywords, pointsCompleted) => {
            totalPointsCompleted = keywordIndex * gridPoints.length + pointsCompleted
            const progress = Math.round((totalPointsCompleted / totalPoints) * 100)

            // Update progress periodically (every 10%)
            if (progress % 10 === 0) {
              await updateScanProgress(scanId!, progress, totalPointsCompleted)
            }
          }
        )

        return results
      })

      // Cast scanResults to proper type (Inngest serializes to JSON which loses type info)
      const typedScanResults = scanResults as unknown as KeywordScanResult[]

      // Step 6: Save grid point results
      await step.run('save-grid-points', async () => {
        const allPointResults = typedScanResults.flatMap((kr) =>
          kr.points
            .filter((p) => p.success)
            .map((p) => ({
              gridRow: p.point.row,
              gridCol: p.point.col,
              lat: p.point.lat,
              lng: p.point.lng,
              keyword: kr.keyword,
              rank: p.targetRank,
              topRankings: p.topRankings,
              totalResults: p.totalResults,
            }))
        )

        await saveGridPointResults(scanId!, allPointResults)
      })

      // Step 7: Aggregate competitor stats
      const aggregation = await step.run('aggregate-stats', async () => {
        const totalPoints = gridPoints.length * keywords.length
        const agg = aggregateCompetitorStats(typedScanResults, campaign.business_name, totalPoints)
        agg.scanId = scanId!

        // Get previous stats for comparison
        const previousStats = await getPreviousCompetitorStats(campaignId, scanId!)

        // Calculate rank changes
        if (previousStats) {
          const prevMap = new Map(
            Array.from(previousStats.entries()).map(([name, s]) => [
              name,
              { avgRank: Number(s.avg_rank) },
            ])
          )
          agg.competitorStats = calculateRankChanges(agg.competitorStats, prevMap)
          agg.targetStats = calculateRankChanges([agg.targetStats], prevMap)[0]!
        }

        return agg
      })

      // Step 8: Save competitor stats
      await step.run('save-competitor-stats', async () => {
        // Include target in competitor stats
        const allStats = [aggregation.targetStats, ...aggregation.competitorStats]
        await saveCompetitorStats(scanId!, allStats)
      })

      // Step 9: Complete scan with metrics
      const completionMetrics = await step.run('complete-scan', async () => {
        const successfulScans = scanResults.reduce((sum, kr) => sum + kr.successfulScans, 0)
        const failedScans = scanResults.reduce((sum, kr) => sum + kr.failedScans, 0)

        await completeGridScan(scanId!, {
          avgRank: aggregation.overallMetrics.avgRank || null,
          shareOfVoice: aggregation.overallMetrics.shareOfVoice,
          topCompetitor: aggregation.overallMetrics.topCompetitor,
          apiCallsUsed: successfulScans,
          estimatedCost: costEstimate.estimatedCost,
          failedPoints: failedScans,
        })

        return {
          avgRank: aggregation.overallMetrics.avgRank,
          shareOfVoice: aggregation.overallMetrics.shareOfVoice,
          apiCallsUsed: successfulScans,
        }
      })

      // Step 10: Update campaign schedule
      await step.run('update-schedule', async () => {
        await updateCampaignSchedule(campaignId, new Date(), campaign.scan_frequency)
      })

      // Step 11: Refresh GBP data
      await step.run('refresh-gbp', async () => {
        await inngest.send({
          name: 'local-seo/gbp.refresh',
          data: { campaignId },
        })
      })

      return {
        success: true,
        scanId,
        ...completionMetrics,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Mark scan as failed if we created one
      if (scanId) {
        await failGridScan(scanId, errorMessage)
      }

      throw error
    }
  }
)

/**
 * GBP data refresh job
 *
 * Fetches latest Google Business Profile data for a campaign
 */
export const refreshGBPData = inngest.createFunction(
  {
    id: 'local-seo-gbp-refresh',
    retries: 2,
  },
  { event: 'local-seo/gbp.refresh' },
  async ({ event, step }) => {
    const { campaignId } = event.data

    const campaign = await step.run('get-campaign', async () => {
      const c = await getLocalCampaign(campaignId)
      if (!c) throw new Error(`Campaign not found: ${campaignId}`)
      return c
    })

    // Fetch GBP data from DataForSEO
    const gbpDataResult = await step.run('fetch-gbp', async () => {
      const businessModule = new BusinessModule(getDataForSEOClient())

      // Try to get business info
      const searchKeyword = `${campaign.business_name} ${campaign.gbp_snapshots[0]?.address || ''}`
      const results = await businessModule.getBusinessInfo({ keyword: searchKeyword.trim() })

      // Return first result (or null if no results)
      return results[0] ?? null
    })

    // Cast to proper type (Inngest serializes to JSON)
    const gbpData = gbpDataResult as unknown as BusinessInfoResult | null

    // Save snapshot if we got data
    if (gbpData) {
      await step.run('save-snapshot', async () => {
        await saveGBPSnapshot(campaignId, {
          businessName: gbpData.title || campaign.business_name,
          gmbPlaceId: campaign.gmb_place_id || undefined,
          gmbCid: gbpData.cid || campaign.gmb_cid || undefined,
          rating: gbpData.rating?.value ?? undefined,
          reviewCount: gbpData.rating?.votes_count ?? undefined,
          ratingDistribution: undefined, // Not available from this API
          address: gbpData.address || undefined,
          phone: gbpData.phone || undefined,
          website: gbpData.domain || undefined,
          categories: gbpData.category ? [gbpData.category] : [],
          attributes: gbpData.attributes as Record<string, unknown> | undefined,
          workHours: gbpData.work_hours as Record<string, unknown> | undefined,
          rawData: gbpData as unknown as Record<string, unknown>,
        })
      })
    }

    return { success: true, hasData: !!gbpData }
  }
)

/**
 * Scheduled scan trigger
 *
 * Runs on a cron schedule to find campaigns due for scanning
 * and triggers scans for each one
 */
export const scheduledScanTrigger = inngest.createFunction(
  {
    id: 'local-seo-scheduled-scans',
  },
  { cron: '0 6 * * *' }, // Run daily at 6 AM UTC
  async ({ step }) => {
    // Get campaigns due for scanning
    const campaignsDue = await step.run('get-due-campaigns', async () => {
      return getCampaignsDueForScan(20) // Process up to 20 at a time
    })

    if (campaignsDue.length === 0) {
      return { triggered: 0 }
    }

    // Trigger scans for each campaign
    await step.run('trigger-scans', async () => {
      const events = campaignsDue.map((c) => ({
        name: 'local-seo/scan.requested' as const,
        data: {
          campaignId: c.id,
          userId: c.user_id,
        },
      }))

      await inngest.send(events)
    })

    return { triggered: campaignsDue.length }
  }
)

// Export all functions for registration
export const localSeoFunctions = [runGridScan, refreshGBPData, scheduledScanTrigger]
