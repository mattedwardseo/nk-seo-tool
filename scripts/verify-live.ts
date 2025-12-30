/**
 * Live Verification Script
 *
 * Verifies that Phase 1-3 actually works with real API calls.
 * Run with: npx tsx scripts/verify-live.ts
 *
 * Cost estimate: ~$0.02 total (smoke test + module tests)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { getDataForSEOClient, resetDataForSEOClient } from '../src/lib/dataforseo/client'
import { OnPageModule } from '../src/lib/dataforseo/modules/onpage'
import { BacklinksModule } from '../src/lib/dataforseo/modules/backlinks'
import { prisma } from '../src/lib/prisma'

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`)
}

function fail(message: string): void {
  console.log(`${colors.red}✗${colors.reset} ${message}`)
}

function section(title: string): void {
  console.log(`\n${colors.cyan}${colors.bold}=== ${title} ===${colors.reset}\n`)
}

async function runSmokeTest(): Promise<boolean> {
  section('Phase 1: Smoke Test')

  // Step 1: Check environment variables
  log('1. Checking environment variables...')
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    fail('Missing credentials!')
    log('   Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env.local', 'red')
    return false
  }

  success(`Login: ${login.substring(0, 5)}...${login.substring(login.length - 5)}`)
  success('Password: [REDACTED]')

  // Step 2: Initialize client
  log('\n2. Initializing DataForSEO client...')
  resetDataForSEOClient() // Clear singleton for fresh test
  const client = getDataForSEOClient()
  success('Client initialized')

  // Step 3: Check API status (makes a REAL API call)
  log('\n3. Testing API connection (real API call to backlinks.summaryLive)...')
  log('   Target: example.com', 'dim')

  const startTime = Date.now()
  const status = await client.checkStatus()
  const duration = Date.now() - startTime

  if (status.success) {
    success(`API connection verified! (${duration}ms)`)
    success(`Message: ${status.message}`)
    return true
  } else {
    fail(`API connection failed: ${status.message}`)
    return false
  }
}

async function runModuleTests(): Promise<boolean> {
  section('Phase 2: Module Tests')

  const client = getDataForSEOClient()
  let allPassed = true

  // Test 1: OnPage Module - Instant Page Audit
  log('1. Testing OnPage Module (instant page audit)...')
  log('   Target: https://example.com', 'dim')

  try {
    const onpage = new OnPageModule(client)
    const startTime = Date.now()
    const pageResult = await onpage.instantPageAudit(
      {
        url: 'https://example.com',
        enableJavascript: false, // Cheaper without JS
      },
      { cache: { skipRead: true, skipWrite: true } } // Skip cache for real test
    )
    const duration = Date.now() - startTime

    if (pageResult) {
      success(`OnPage audit complete! (${duration}ms)`)
      log(`   • OnPage Score: ${pageResult.onpage_score ?? 'N/A'}`, 'cyan')
      log(`   • HTTPS: ${pageResult.checks?.is_https ?? 'N/A'}`, 'cyan')
      log(`   • Has Title: ${pageResult.checks?.has_meta_title ?? 'N/A'}`, 'cyan')
      log(`   • Has Description: ${pageResult.checks?.has_meta_description ?? 'N/A'}`, 'cyan')
      log(`   • Is Responsive: ${pageResult.checks?.is_responsive ?? 'N/A'}`, 'cyan')
      if (pageResult.page_timing) {
        log(`   • DOM Complete: ${pageResult.page_timing.dom_complete ?? 'N/A'}ms`, 'cyan')
      }
    } else {
      fail('OnPage audit returned null')
      allPassed = false
    }
  } catch (error) {
    fail(`OnPage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    allPassed = false
  }

  // Test 2: Backlinks Module - Summary
  log('\n2. Testing Backlinks Module (summary)...')
  log('   Target: example.com', 'dim')

  try {
    const backlinks = new BacklinksModule(client)
    const startTime = Date.now()
    const summary = await backlinks.getSummary(
      {
        target: 'example.com',
        includeSubdomains: true,
      },
      { cache: { skipRead: true, skipWrite: true } }
    )
    const duration = Date.now() - startTime

    if (summary) {
      success(`Backlinks summary complete! (${duration}ms)`)
      log(`   • Total Backlinks: ${summary.backlinks?.toLocaleString() ?? 'N/A'}`, 'cyan')
      log(`   • Referring Domains: ${summary.referring_domains?.toLocaleString() ?? 'N/A'}`, 'cyan')
      log(`   • Domain Rank: ${summary.rank ?? 'N/A'}`, 'cyan')
      log(`   • Spam Score: ${summary.backlinks_spam_score ?? 'N/A'}`, 'cyan')
    } else {
      fail('Backlinks summary returned null')
      allPassed = false
    }
  } catch (error) {
    fail(`Backlinks test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    allPassed = false
  }

  return allPassed
}

async function runDatabaseTest(): Promise<boolean> {
  section('Phase 3: Database Verification')

  // Test 1: Basic connection
  log('1. Testing database connection...')

  try {
    await prisma.$connect()
    success('Connected to PostgreSQL')

    // Test 2: Check TimescaleDB
    log('\n2. Verifying TimescaleDB extension...')
    const timescaleResult = await prisma.$queryRaw<
      { installed_version: string }[]
    >`SELECT installed_version FROM pg_available_extensions WHERE name = 'timescaledb'`

    if (timescaleResult?.[0]?.installed_version) {
      success(`TimescaleDB version: ${timescaleResult[0].installed_version}`)
    } else {
      log('   TimescaleDB not installed (optional for basic testing)', 'yellow')
    }

    // Test 3: Check tables exist
    log('\n3. Verifying database tables...')
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `
    const tableNames = tables.map((t) => t.tablename)
    success(`Tables found: ${tableNames.join(', ')}`)

    // Test 4: Count existing records
    log('\n4. Checking existing data...')
    const userCount = await prisma.users.count()
    const auditCount = await prisma.audits.count()
    log(`   • Users: ${userCount}`, 'cyan')
    log(`   • Audits: ${auditCount}`, 'cyan')

    await prisma.$disconnect()
    return true
  } catch (error) {
    fail(`Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    await prisma.$disconnect()
    return false
  }
}

async function main(): Promise<void> {
  console.log(`${colors.bold}`)
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║       SEO Audit Platform - Live Verification             ║')
  console.log('║       Testing with REAL API calls and database           ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(colors.reset)

  const results = {
    smokeTest: false,
    moduleTests: false,
    database: false,
  }

  try {
    // Phase 1: Smoke Test
    results.smokeTest = await runSmokeTest()
    if (!results.smokeTest) {
      log('\nSmoke test failed. Fix issues before proceeding.', 'red')
      process.exit(1)
    }

    // Phase 2: Module Tests
    results.moduleTests = await runModuleTests()

    // Phase 3: Database
    results.database = await runDatabaseTest()
  } catch (error) {
    fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)
    process.exit(1)
  }

  // Summary
  section('Verification Summary')

  const allPassed = results.smokeTest && results.moduleTests && results.database

  log(`Smoke Test:    ${results.smokeTest ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`)
  log(`Module Tests:  ${results.moduleTests ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`)
  log(`Database:      ${results.database ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`)

  console.log()
  if (allPassed) {
    log('╔══════════════════════════════════════════════════════════╗', 'green')
    log('║        ALL TESTS PASSED - System is verified!            ║', 'green')
    log('╚══════════════════════════════════════════════════════════╝', 'green')
    console.log()
    log('Next step: Run full E2E audit', 'cyan')
    log('1. Start Next.js: npm run dev', 'dim')
    log('2. Start Inngest: npx inngest-cli@latest dev', 'dim')
    log('3. Open Prisma Studio: npx prisma studio', 'dim')
    log('4. Trigger audit via curl (see CLAUDE.md for command)', 'dim')
  } else {
    log('╔══════════════════════════════════════════════════════════╗', 'red')
    log('║        SOME TESTS FAILED - Check output above            ║', 'red')
    log('╚══════════════════════════════════════════════════════════╝', 'red')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
