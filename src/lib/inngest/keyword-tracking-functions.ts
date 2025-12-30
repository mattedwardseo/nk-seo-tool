/**
 * Keyword Tracking Inngest Functions
 *
 * Background job orchestration for keyword SERP position tracking.
 * - Main orchestrator: Tracks keywords for a domain
 * - Scheduled trigger: Runs due schedules hourly
 *
 * Phase 15: Keyword Tracking Tool
 */

import { inngest } from '../inngest'
import { prisma } from '../prisma'
import { getLiveSerpRankings } from '../competitors/competitor-analysis'
import { getDataForSEOClient } from '../dataforseo/client'
import { LabsModule } from '../dataforseo/modules/labs'
import {
  updateRunStatus,
  updateRunProgress,
  completeRun,
  failRun,
  saveKeywordResults,
  getPreviousRun,
  getPreviousResults,
  createKeywordTrackingRun,
  getSchedulesDue,
  updateScheduleAfterRun,
  type SaveResultInput,
  type CompletionMetrics,
} from '../db/keyword-tracking-operations'

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Get the most recent month with volume data from historical keyword data
 * Looks back through months until it finds a non-null, non-zero value
 */
function getMostRecentVolume(
  historicalData: Array<{ year: number; month: number; search_volume: number | null; cpc?: number | null; keyword_difficulty?: number | null }>
): { volume: number | null; cpc: number | null; kd: number | null; date: string | null } {
  if (!historicalData || historicalData.length === 0) {
    return { volume: null, cpc: null, kd: null, date: null }
  }

  // Sort by year DESC, then month DESC (most recent first)
  const sorted = [...historicalData].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  // Find first non-null, positive volume
  for (const item of sorted) {
    if (item.search_volume !== null && item.search_volume > 0) {
      return {
        volume: item.search_volume,
        cpc: item.cpc ?? null,
        kd: item.keyword_difficulty ?? null,
        date: `${item.year}-${String(item.month).padStart(2, '0')}`,
      }
    }
  }

  return { volume: null, cpc: null, kd: null, date: null }
}

/**
 * Check if a keyword is a "dentist + city" pattern that needs historical fallback
 * Google Ads blocks search volume for these healthcare + location keywords
 */
function isDentistCityKeyword(keyword: string): boolean {
  const normalizedKeyword = keyword.toLowerCase().trim()

  const dentalTerms = [
    'dentist',
    'dental',
    'orthodontist',
    'endodontist',
    'periodontist',
    'prosthodontist',
    'oral surgeon',
    'cosmetic dentist',
    'pediatric dentist',
    'family dentist',
    'emergency dentist',
    'implant dentist',
    'invisalign',
    'dentures',
    'veneers',
    'teeth whitening',
    'root canal',
    'dental implants',
    'dental crown',
    'dental bridge',
  ]

  const hasDentalTerm = dentalTerms.some((term) => normalizedKeyword.includes(term))
  if (!hasDentalTerm) return false

  // Check for location indicators (city names, "near me", state abbreviations)
  const locationIndicators = [
    /\b[a-z]+\s+(tx|ca|ny|fl|il|pa|oh|ga|nc|mi|nj|va|wa|az|ma|tn|in|mo|md|wi|co|mn|sc|al|la|ky|or|ok|ct|ut|ia|nv|ar|ms|ks|nm|ne|wv|id|hi|nh|me|mt|ri|de|sd|nd|ak|dc|vt|wy)\b/i,
    /near me/i,
    /\b(chicago|houston|phoenix|philadelphia|san antonio|san diego|dallas|san jose|austin|jacksonville|fort worth|columbus|charlotte|indianapolis|seattle|denver|washington|boston|nashville|baltimore|oklahoma city|louisville|portland|las vegas|milwaukee|albuquerque|tucson|fresno|sacramento|mesa|atlanta|kansas city|colorado springs|miami|raleigh|omaha|long beach|virginia beach|oakland|minneapolis|tulsa|arlington|tampa|new orleans|wichita|cleveland|bakersfield|aurora|anaheim|honolulu|santa ana|riverside|corpus christi|lexington|stockton|henderson|saint paul|st\. louis|cincinnati|pittsburgh|greensboro|anchorage|plano|lincoln|orlando|irvine|newark|toledo|durham|chula vista|fort wayne|jersey city|st\. petersburg|laredo|scottsdale|chandler|gilbert|madison|lubbock|reno|buffalo|glendale|north las vegas|irving|chesapeake|fremont|baton rouge|richmond|boise|san bernardino|birmingham|spokane|rochester|des moines|modesto|fayetteville|tacoma|oxnard|fontana|moreno valley|columbus|yonkers|shreveport|akron|little rock|amarillo|augusta|mobile|huntsville|grand rapids|salt lake city|tallahassee|worcester|grand prairie|cape coral|overland park|sioux falls|peoria|providence|vancouver|knoxville|brownsville|fort lauderdale|tempe|ontario|springfield|pomona|santa clara|pasadena|rockford|joliet|paterson|bridgeport|savannah|cary|murfreesboro|mesquite|killeen|syracuse|mcallen|roseville|lakewood|bellevue|torrance|hollywood|sunnyvale|clarksville|victorville|west valley city|palmdale|hayward|elizabeth|carrollton|olathe|new haven|columbia|sterling heights|alexandria|salinas|fullerton|thousand oaks|topeka|simi valley|concord|kent|hartford|visalia|orange|waco|vallejo|stamford|berkeley|manchester|miramar|coral springs|norman|el monte|midland|round rock|west jordan|downey|costa mesa|pueblo|clearwater|west covina|inglewood|richardson|fairfield|murrieta|elgin|waterbury|gresham|arvada|carlsbad|westminster|league city|billings|lowell|denton|high point|cambridge|ventura|pueblo|antioch|palm bay|independence|provo|el cajon|ann arbor|rochester|peoria|lansing|odessa|fargo|south bend|evansville|tyler|mckinney|college station|beaumont|wilmington|north charleston|temecula|santa maria|edinburg|pearland|centennial|sandy springs|gainesville|broken arrow|edison|mesquite|green bay|lewisville|wichita falls|sparks|abilene|san angelo|dayton|boulder|allen|las cruces|everett|rialto|burbank|el cajon|vacaville|santa rosa|longview|tyler|richardson|league city|jurupa valley|san mateo|rio rancho|daly city|nampa|davie|south gate|mission viejo|mission|menifee|asheville|plantation|tuscaloosa|cicero|hillsboro|lawrence|lynn|albany|hoover|citrus heights|yuma|redding|newport beach|san ramon|lake forest|hemet|lakeland|bloomington|quincy|champaign|fall river|gary|brockton|medford|trenton|hesperia|lynn|chico|santa barbara|springfield|warwick|norwalk|newport news|portsmouth|dayton|el cajon|concord|clifton|livermore|santa clarita|hampton|paterson|jackson|troy|renton|bolingbrook|plantation|west palm beach)\b/i,
  ]

  return locationIndicators.some((pattern) => pattern.test(normalizedKeyword))
}

/**
 * Main keyword tracking orchestrator
 *
 * Workflow:
 * 1. Update status to RUNNING
 * 2. Get tracked keywords for domain
 * 3. Get previous run results for comparison
 * 4. Fetch SERP rankings for each keyword (batched)
 * 5. Save results
 * 6. Calculate metrics
 * 7. Complete run
 */
export const runKeywordTracking = inngest.createFunction(
  {
    id: 'keyword-tracking-run',
    retries: 2,
    throttle: { limit: 10, period: '1m' },
  },
  { event: 'keyword-tracking/run.requested' },
  async ({ event, step }) => {
    const { runId, domainId, config } = event.data

    try {
      // Step 1: Update status to RUNNING
      await step.run('update-status-running', async () => {
        await updateRunStatus(runId, 'RUNNING')
      })

      // Step 2: Get domain info and tracked keywords
      const { domain, keywords } = await step.run('get-keywords', async () => {
        // Get domain
        const domainRecord = await prisma.domains.findUnique({
          where: { id: domainId },
          select: { domain: true },
        })

        if (!domainRecord) {
          throw new Error('Domain not found')
        }

        // Get tracked keywords for this domain
        const trackedKeywords = await prisma.tracked_keywords.findMany({
          where: {
            domain_id: domainId,
            is_active: true,
          },
          select: {
            id: true,
            keyword: true,
            search_volume: true,
            cpc: true,
          },
          orderBy: { keyword: 'asc' },
        })

        return {
          domain: domainRecord.domain,
          keywords: trackedKeywords,
        }
      })

      if (keywords.length === 0) {
        throw new Error(
          'No tracked keywords found for this domain. Add keywords in the keyword library first.'
        )
      }

      // Step 3: Get previous run results for comparison
      // Note: Using plain object instead of Map because Inngest serializes step results to JSON
      const previousResults = await step.run('get-previous-results', async () => {
        const prevRun = await getPreviousRun(domainId, runId)
        if (!prevRun) return {} as Record<string, { position: number | null }>
        const resultsMap = await getPreviousResults(prevRun.id)
        // Convert Map to plain object for JSON serialization
        const obj: Record<string, { position: number | null }> = {}
        resultsMap.forEach((value, key) => {
          obj[key] = value
        })
        return obj
      })

      // Step 3.5: Fetch search volume from Historical API for dentist+city keywords
      // Google Ads blocks these, so we need historical data
      const searchVolumeData = await step.run('fetch-search-volume', async () => {
        // Find keywords that need search volume lookup
        const keywordsNeedingVolume = keywords.filter(
          (kw) => kw.search_volume === null && isDentistCityKeyword(kw.keyword)
        )

        if (keywordsNeedingVolume.length === 0) {
          return {} as Record<string, { searchVolume: number | null; cpc: number | null; kd: number | null; volumeDate: string | null }>
        }

        console.log(`[Keyword Tracking] Fetching historical data for ${keywordsNeedingVolume.length} dentist+city keywords`)

        try {
          const client = getDataForSEOClient()
          const labs = new LabsModule(client)

          // Batch keywords for API call (max 1000 per request)
          const volumeMap: Record<string, { searchVolume: number | null; cpc: number | null; kd: number | null; volumeDate: string | null }> = {}
          const batchSize = 100

          for (let i = 0; i < keywordsNeedingVolume.length; i += batchSize) {
            const batch = keywordsNeedingVolume.slice(i, i + batchSize)
            const batchKeywords = batch.map((k) => k.keyword)

            const historicalData = await labs.getHistoricalKeywordData({
              keywords: batchKeywords,
              locationName: config.locationName || 'United States',
              languageCode: 'en',
            })

            // Process results - historicalData is already an array of items
            if (historicalData && historicalData.length > 0) {
              for (const item of historicalData) {
                if (item.keyword && item.history) {
                  // Transform history into format getMostRecentVolume expects
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const historyWithKeywordInfo = item.history.map((h: any) => ({
                    year: h.year as number,
                    month: h.month as number,
                    search_volume: (h.keyword_info?.search_volume as number | null) ?? null,
                    cpc: (h.keyword_info?.cpc as number | null) ?? null,
                    keyword_difficulty: (h.keyword_info?.keyword_difficulty as number | null) ?? null,
                  }))

                  // Use getMostRecentVolume to look back through all months
                  const { volume, cpc, kd, date } = getMostRecentVolume(historyWithKeywordInfo)

                  volumeMap[item.keyword.toLowerCase()] = {
                    searchVolume: volume,
                    cpc: cpc,
                    kd: kd,
                    volumeDate: date,
                  }
                }
              }
            }

            // Small delay between batches
            if (i + batchSize < keywordsNeedingVolume.length) {
              await delay(200)
            }
          }

          console.log(`[Keyword Tracking] Got historical volume for ${Object.keys(volumeMap).length} keywords`)
          return volumeMap
        } catch (error) {
          console.error('[Keyword Tracking] Error fetching historical data:', error)
          return {} as Record<string, { searchVolume: number | null; cpc: number | null; kd: number | null; volumeDate: string | null }>
        }
      })

      // Step 4: Fetch SERP rankings for all keywords (batched)
      const results = await step.run('fetch-rankings', async () => {
        const allResults: SaveResultInput[] = []
        const batchSize = 5
        let processedCount = 0

        for (let i = 0; i < keywords.length; i += batchSize) {
          const batch = keywords.slice(i, i + batchSize)

          const batchResults = await Promise.all(
            batch.map(async (kw) => {
              try {
                const serp = await getLiveSerpRankings(
                  kw.keyword,
                  domain,
                  [], // No competitors needed for basic tracking
                  config.locationName
                )

                const prevData = previousResults[kw.id]
                const prevPosition = prevData?.position ?? null
                const position = serp.clientPosition

                // Calculate position change (positive = improvement)
                let positionChange: number | null = null
                if (position !== null && prevPosition !== null) {
                  positionChange = prevPosition - position // Lower position is better
                }

                // Extract top 3 domains from SERP
                const top3Domains: Array<{
                  domain: string
                  position: number
                  url: string
                }> = []
                // The SERP result has topDomain but not detailed top 3
                // We'll just store what we have
                if (serp.topDomain) {
                  top3Domains.push({
                    domain: serp.topDomain,
                    position: 1,
                    url: '',
                  })
                }

                // Get search volume - prefer stored, fallback to historical API data
                const historicalData = searchVolumeData[kw.keyword.toLowerCase()]
                const searchVolume = kw.search_volume ?? historicalData?.searchVolume ?? null
                const cpc = kw.cpc ? Number(kw.cpc) : (historicalData?.cpc ?? null)
                const keywordDifficulty = historicalData?.kd ?? null
                const volumeDate = historicalData?.volumeDate ?? null

                return {
                  trackedKeywordId: kw.id,
                  keyword: kw.keyword,
                  searchVolume,
                  volumeDate,
                  cpc,
                  keywordDifficulty,
                  position,
                  previousPosition: prevPosition,
                  positionChange,
                  rankingUrl: null, // Could extract from SERP if needed
                  serpFeatures: serp.serpFeatures,
                  top3Domains: top3Domains.length > 0 ? top3Domains : null,
                  // Local pack data
                  localPackPosition: serp.localPack?.position ?? null,
                  localPackRating: serp.localPack?.rating ?? null,
                  localPackReviews: serp.localPack?.reviewsCount ?? null,
                  localPackCid: serp.localPack?.cid ?? null,
                }
              } catch (error) {
                console.error(`Error fetching SERP for "${kw.keyword}":`, error)
                // Return a result with null position on error
                const prevData = previousResults[kw.id]
                // Get search volume - prefer stored, fallback to historical API data
                const historicalData = searchVolumeData[kw.keyword.toLowerCase()]
                const searchVolume = kw.search_volume ?? historicalData?.searchVolume ?? null
                const cpc = kw.cpc ? Number(kw.cpc) : (historicalData?.cpc ?? null)
                const keywordDifficulty = historicalData?.kd ?? null
                const volumeDate = historicalData?.volumeDate ?? null

                return {
                  trackedKeywordId: kw.id,
                  keyword: kw.keyword,
                  searchVolume,
                  volumeDate,
                  cpc,
                  keywordDifficulty,
                  position: null,
                  previousPosition: prevData?.position ?? null,
                  positionChange: null,
                  rankingUrl: null,
                  serpFeatures: [],
                  top3Domains: null,
                  // Local pack data (null on error)
                  localPackPosition: null,
                  localPackRating: null,
                  localPackReviews: null,
                  localPackCid: null,
                }
              }
            })
          )

          allResults.push(...batchResults)
          processedCount += batch.length

          // Update progress
          const progress = Math.round((processedCount / keywords.length) * 90)
          await updateRunProgress(runId, progress)

          // Rate limit delay between batches
          if (i + batchSize < keywords.length) {
            await delay(200)
          }
        }

        return allResults
      })

      // Step 5: Save results
      await step.run('save-results', async () => {
        await saveKeywordResults(runId, results)
      })

      // Step 6: Calculate metrics
      const metrics = await step.run('calculate-metrics', async () => {
        const positions = results
          .filter((r) => r.position !== null)
          .map((r) => r.position as number)

        const avgPosition =
          positions.length > 0
            ? positions.reduce((a, b) => a + b, 0) / positions.length
            : null

        const metrics: CompletionMetrics = {
          keywordsTracked: results.length,
          avgPosition,
          keywordsInTop3: results.filter((r) => r.position !== null && r.position <= 3)
            .length,
          keywordsInTop10: results.filter(
            (r) => r.position !== null && r.position <= 10
          ).length,
          keywordsInTop100: results.filter(
            (r) => r.position !== null && r.position <= 100
          ).length,
          keywordsNotRanking: results.filter((r) => r.position === null).length,
          improvedCount: results.filter(
            (r) => r.positionChange !== null && r.positionChange > 0
          ).length,
          declinedCount: results.filter(
            (r) => r.positionChange !== null && r.positionChange < 0
          ).length,
          unchangedCount: results.filter((r) => r.positionChange === 0).length,
          newRankingsCount: results.filter(
            (r) => r.position !== null && r.previousPosition === null
          ).length,
          lostRankingsCount: results.filter(
            (r) => r.position === null && r.previousPosition !== null
          ).length,
          apiCallsUsed: results.length,
          estimatedCost: results.length * 0.002, // ~$0.002 per SERP query
        }

        return metrics
      })

      // Step 7: Complete run
      await step.run('complete-run', async () => {
        await completeRun(runId, metrics)
      })

      // Emit completion event
      await step.sendEvent('emit-completion', {
        name: 'keyword-tracking/run.completed',
        data: {
          runId,
          domainId,
          keywordsTracked: metrics.keywordsTracked,
          avgPosition: metrics.avgPosition,
        },
      })

      return {
        success: true,
        runId,
        keywordsTracked: metrics.keywordsTracked,
        avgPosition: metrics.avgPosition,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      await failRun(runId, errorMessage)

      // Emit failure event
      await inngest.send({
        name: 'keyword-tracking/run.failed',
        data: { runId, error: errorMessage },
      })

      throw error
    }
  }
)

/**
 * Scheduled keyword tracking trigger
 *
 * Runs every hour and checks for schedules that are due.
 * Creates runs for each due schedule and triggers the orchestrator.
 */
export const scheduledKeywordTracking = inngest.createFunction(
  {
    id: 'keyword-tracking-scheduled',
  },
  { cron: '0 * * * *' }, // Every hour at :00
  async ({ step }) => {
    // Get schedules due for execution
    const dueSchedules = await step.run('get-due-schedules', async () => {
      return getSchedulesDue(20)
    })

    if (dueSchedules.length === 0) {
      return { triggered: 0, message: 'No schedules due' }
    }

    // Create runs and trigger events
    const triggeredRuns = await step.run('trigger-runs', async () => {
      const runs: Array<{ runId: string; domainId: string }> = []

      for (const schedule of dueSchedules) {
        try {
          // Create the run
          const runId = await createKeywordTrackingRun(schedule.userId, {
            domainId: schedule.domainId,
            locationName: schedule.locationName,
            languageCode: schedule.languageCode,
            triggeredBy: 'scheduled',
          })

          runs.push({ runId, domainId: schedule.domainId })

          // Update schedule with next run time
          await updateScheduleAfterRun(schedule.domainId, runId)
        } catch (error) {
          console.error(
            `Error creating scheduled run for domain ${schedule.domainId}:`,
            error
          )
        }
      }

      return runs
    })

    // Trigger runs in parallel
    if (triggeredRuns.length > 0) {
      await step.sendEvent(
        'trigger-tracking-runs',
        triggeredRuns.map((run) => ({
          name: 'keyword-tracking/run.requested' as const,
          data: {
            runId: run.runId,
            domainId: run.domainId,
            userId: '', // Will be ignored, run already has user_id
            config: {
              locationName: 'United States',
              languageCode: 'en',
            },
          },
        }))
      )
    }

    return {
      triggered: triggeredRuns.length,
      runs: triggeredRuns,
    }
  }
)

// Export all functions for registration
export const keywordTrackingFunctions = [
  runKeywordTracking,
  scheduledKeywordTracking,
]
