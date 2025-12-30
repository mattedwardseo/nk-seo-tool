/**
 * Test Script: Historical Keyword Data Enrichment
 *
 * Tests the DataForSEO Historical Keyword Data API directly to verify
 * which keywords have data and what the data looks like.
 *
 * Usage: npx tsx scripts/test-historical-enrichment.ts
 */

import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function testHistoricalKeywordData(): Promise<void> {
  // Dynamically import to handle module resolution
  const { getDataForSEOClient } = await import('../src/lib/dataforseo/client')
  const { LabsModule } = await import('../src/lib/dataforseo/modules/labs')

  console.log('='.repeat(70))
  console.log('Historical Keyword Data API Test')
  console.log('='.repeat(70))

  // Create client and module
  const client = getDataForSEOClient()
  const labs = new LabsModule(client)

  // Test keywords - mix of known blocked and available keywords
  const testKeywords = [
    // Arlington keywords (from the audit)
    'dentist arlington tx',
    'cosmetic dentist arlington',
    'dentist arlington',
    'invisalign arlington',
    'veneers arlington',
    'arlington dentist',
    'dental implants arlington',
    'dentures arlington',
    // Generic tests
    'dentist chicago', // Known to be blocked
    'dental implants chicago', // Should have data
  ]

  console.log(`\nTesting ${testKeywords.length} keywords with Historical Keyword Data API...`)
  console.log('Location: United States')
  console.log('Language: en\n')

  try {
    console.log('Making API call...')
    const results = await labs.getHistoricalKeywordData({
      keywords: testKeywords,
      locationName: 'United States',
      languageCode: 'en',
    })

    console.log(`API returned ${results.length} results`)
    console.log('First result structure:', JSON.stringify(results[0], null, 2).slice(0, 500))
    console.log('')
    console.log('='.repeat(70))

    for (const item of results) {
      console.log(`\nKeyword: "${item.keyword}"`)
      console.log(`  Location Code: ${item.location_code}`)
      console.log(`  Language Code: ${item.language_code}`)

      if (!item.history || item.history.length === 0) {
        console.log('  History: NO DATA AVAILABLE')
        continue
      }

      console.log(`  History: ${item.history.length} months of data`)

      // Show most recent 3 months
      console.log('  Recent months:')
      const sortedHistory = [...item.history].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

      for (const month of sortedHistory.slice(0, 3)) {
        const info = month.keyword_info
        const volume = info?.search_volume ?? 'N/A'
        const cpc = info?.cpc?.toFixed(2) ?? 'N/A'
        const competition = info?.competition_level ?? 'N/A'
        console.log(
          `    ${month.year}-${String(month.month).padStart(2, '0')}: ` +
            `volume=${volume}, cpc=$${cpc}, competition=${competition}`
        )
      }

      // Find most recent month with actual data
      const latestWithData = sortedHistory.find(
        (m) => m.keyword_info?.search_volume !== null && m.keyword_info?.search_volume !== undefined
      )

      if (latestWithData) {
        const info = latestWithData.keyword_info!
        console.log(
          `  Latest with data: ${latestWithData.year}-${String(latestWithData.month).padStart(2, '0')} ` +
            `(volume: ${info.search_volume})`
        )
      } else {
        console.log('  Latest with data: NONE FOUND')
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))

    const withData = results.filter((r) => r.history && r.history.length > 0)
    const withVolume = results.filter((r) =>
      r.history?.some((h) => h.keyword_info?.search_volume !== null && h.keyword_info?.search_volume !== undefined)
    )

    console.log(`Total keywords tested: ${testKeywords.length}`)
    console.log(`Keywords with history: ${withData.length}`)
    console.log(`Keywords with search volume data: ${withVolume.length}`)
    console.log(`Keywords with no data: ${testKeywords.length - withVolume.length}`)
  } catch (error) {
    console.error('Error calling Historical Keyword Data API:', error)
    process.exit(1)
  }
}

// Run the test
testHistoricalKeywordData()
  .then(() => {
    console.log('\nTest completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
