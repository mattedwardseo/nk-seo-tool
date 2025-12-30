/**
 * Fielder Park Dental Audit Seeding Script
 *
 * Deletes existing audits for fielderparkdental.com and creates a fresh one
 * with all the standard test data (keywords, competitors, GMB).
 *
 * Run with: npm run seed:audit
 *
 * Prerequisites:
 *   - npm run dev           (dev server running)
 *   - npx inngest-cli@latest dev  (Inngest dev server running)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables BEFORE importing anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { prisma } from '../src/lib/prisma'
import { createAudit, getAuditStatus } from '../src/lib/db/audit-operations'

const INNGEST_DEV_URL = 'http://localhost:8288'

// ============================================================================
// TEST DATA - Hardcoded Fielder Park Dental Configuration
// ============================================================================
const TEST_DATA = {
  domain: 'fielderparkdental.com',
  businessName: 'Fielder Park Dental',
  city: 'Arlington',
  state: 'TX',
  location: 'Arlington, Texas',
  gmbPlaceId: 'ChIJsat6ael9ToYRaTxlWHh7yxg',
  competitorDomains: [
    'myamazingdental.com',
    'ourarlingtondentist.com',
    'arlingtonfamilydentistry.com',
    'arlingtonbrightsmiles.com',
    'smilesarlington.com',
  ],
}

const TEST_USER_EMAIL = 'test@example.com'

// ============================================================================
// Terminal Colors
// ============================================================================
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

// ============================================================================
// Step 1: Find Test User
// ============================================================================
async function findTestUser(): Promise<string> {
  log('\n1. Finding test user...', 'cyan')

  const user = await prisma.users.findUnique({
    where: { email: TEST_USER_EMAIL },
  })

  if (!user) {
    throw new Error(
      `Test user not found: ${TEST_USER_EMAIL}\nRun: npx tsx scripts/seed-user.ts`
    )
  }

  log(`   ${colors.green}✓${colors.reset} Found user: ${user.email}`)
  log(`   User ID: ${user.id}`, 'dim')
  return user.id
}

// ============================================================================
// Step 2: Delete Existing Audits
// ============================================================================
async function deleteExistingAudits(userId: string): Promise<number> {
  log('\n2. Deleting existing audits for fielderparkdental.com...', 'cyan')

  const result = await prisma.audits.deleteMany({
    where: {
      userId: userId,
      domain: TEST_DATA.domain,
    },
  })

  if (result.count > 0) {
    log(`   ${colors.green}✓${colors.reset} Deleted ${result.count} audit(s)`)
  } else {
    log(`   No existing audits found`, 'dim')
  }

  return result.count
}

// ============================================================================
// Step 3: Load Saved Keywords
// ============================================================================
async function loadSavedKeywords(userId: string): Promise<string[]> {
  log('\n3. Loading saved keywords...', 'cyan')

  const keywords = await prisma.tracked_keywords.findMany({
    where: {
      user_id: userId,
      domain: TEST_DATA.domain,
      is_active: true,
    },
    select: {
      keyword: true,
    },
    orderBy: {
      created_at: 'asc',
    },
  })

  const keywordList = keywords.map((k) => k.keyword)

  if (keywordList.length > 0) {
    log(
      `   ${colors.green}✓${colors.reset} Found ${keywordList.length} saved keywords`
    )
    log(`   Sample: ${keywordList.slice(0, 3).join(', ')}...`, 'dim')
  } else {
    log(`   No saved keywords found - audit will use default dental keywords`, 'yellow')
  }

  return keywordList
}

// ============================================================================
// Step 4: Create Audit Directly (bypasses API auth)
// ============================================================================
async function createTestAudit(
  userId: string,
  keywords: string[]
): Promise<string> {
  log('\n4. Creating audit directly...', 'cyan')
  log(`   Domain: ${TEST_DATA.domain}`, 'dim')
  log(`   Business: ${TEST_DATA.businessName}`, 'dim')
  log(`   Location: ${TEST_DATA.city}, ${TEST_DATA.state}`, 'dim')
  log(`   Competitors: ${TEST_DATA.competitorDomains.length}`, 'dim')
  log(`   Keywords: ${keywords.length}`, 'dim')

  // Create audit record in database
  const auditId = await createAudit({
    userId,
    domain: TEST_DATA.domain,
    businessName: TEST_DATA.businessName,
    location: TEST_DATA.location,
    city: TEST_DATA.city,
    state: TEST_DATA.state,
    gmbPlaceId: TEST_DATA.gmbPlaceId,
    targetKeywords: keywords.length > 0 ? keywords : undefined,
    competitorDomains: TEST_DATA.competitorDomains,
  })

  log(`   ${colors.green}✓${colors.reset} Audit record created: ${auditId}`)

  // Trigger Inngest background job via dev server
  log('   Triggering Inngest job via dev server...', 'dim')

  const eventPayload = {
    name: 'audit/requested',
    data: {
      auditId,
      domain: TEST_DATA.domain,
      userId,
      options: { skipCache: true },
      businessName: TEST_DATA.businessName,
      location: TEST_DATA.location,
      gmbPlaceId: TEST_DATA.gmbPlaceId,
      targetKeywords: keywords.length > 0 ? keywords : undefined,
      competitorDomains: TEST_DATA.competitorDomains,
    },
  }

  const response = await fetch(`${INNGEST_DEV_URL}/e/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventPayload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to trigger Inngest: ${response.status} ${text}`)
  }

  log(`   ${colors.green}✓${colors.reset} Inngest job triggered!`)

  return auditId
}

// Step descriptions for display
const stepDescriptions: Record<string, string> = {
  onpage_crawl: 'Analyzing technical SEO and page performance',
  serp_analysis: 'Checking keyword rankings and search presence',
  backlinks_analysis: 'Evaluating backlink profile and authority',
  competitor_analysis: 'Analyzing competitor domains',
  business_data: 'Gathering business listing and review data',
}

// ============================================================================
// Step 5: Poll Status (Direct DB)
// ============================================================================
async function pollStatus(auditId: string): Promise<void> {
  log('\n5. Polling audit status...', 'cyan')
  log('   (Ctrl+C to stop polling)\n', 'dim')

  let lastStatus = ''
  let lastProgress = -1
  let pollCount = 0
  const maxPolls = 120 // 4 minutes (2s intervals)

  while (pollCount < maxPolls) {
    try {
      // Poll directly from database
      const status = await getAuditStatus(auditId)

      if (!status) {
        log(`   Error: Audit not found`, 'red')
        break
      }

      // Only log if something changed
      if (status.status !== lastStatus || status.progress !== lastProgress) {
        const progressBar = createProgressBar(status.progress)
        log(`   ${progressBar} ${status.progress}% - ${status.status}`)

        if (status.current_step) {
          const description = stepDescriptions[status.current_step] || status.current_step
          log(`   └─ ${description}`, 'dim')
        }

        lastStatus = status.status
        lastProgress = status.progress
      }

      // Check if complete or failed
      if (status.status === 'COMPLETED') {
        log(`\n${colors.green}✓ Audit completed!${colors.reset}`)
        await showFinalInfo(auditId)
        return
      }

      if (status.status === 'FAILED') {
        log(`\n${colors.red}✗ Audit failed${colors.reset}`)
        if (status.error_message) {
          log(`   Error: ${status.error_message}`, 'red')
        }
        return
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000))
      pollCount++
    } catch (error) {
      log(
        `   Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        'red'
      )
      break
    }
  }

  if (pollCount >= maxPolls) {
    log('\n   Timeout - audit still in progress after 4 minutes', 'yellow')
    log('   Check Inngest dashboard at http://localhost:8288', 'yellow')
    await showFinalInfo(auditId)
  }
}

function createProgressBar(progress: number): string {
  const total = 20
  const filled = Math.round((progress / 100) * total)
  const empty = total - filled
  return `[${colors.green}${'█'.repeat(filled)}${colors.reset}${'░'.repeat(empty)}]`
}

// ============================================================================
// Step 6: Show Final Info
// ============================================================================
async function showFinalInfo(auditId: string): Promise<void> {
  log('\n╔════════════════════════════════════════════════════╗', 'green')
  log('║              AUDIT READY                           ║', 'green')
  log('╚════════════════════════════════════════════════════╝', 'green')

  log(`\nView in browser:`, 'cyan')
  log(`   ${colors.bold}http://localhost:3000/audits/${auditId}${colors.reset}`)

  log(`\nInngest dashboard:`, 'cyan')
  log(`   http://localhost:8288`, 'dim')

  log('\n')
}

// ============================================================================
// Main
// ============================================================================
async function main(): Promise<void> {
  console.log(`${colors.bold}`)
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║       Fielder Park Dental - Test Audit Seeder           ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(colors.reset)

  log('This will delete existing audits and create a fresh one.', 'yellow')
  log(`Domain: ${TEST_DATA.domain}`, 'dim')
  log(`User: ${TEST_USER_EMAIL}\n`, 'dim')

  try {
    // Step 1: Find test user
    const userId = await findTestUser()

    // Step 2: Delete existing audits
    await deleteExistingAudits(userId)

    // Step 3: Load saved keywords
    const keywords = await loadSavedKeywords(userId)

    // Step 4: Create audit
    const auditId = await createTestAudit(userId, keywords)

    // Step 5: Poll status until complete
    await pollStatus(auditId)
  } catch (error) {
    log(`\nError: ${error instanceof Error ? error.message : 'Unknown'}`, 'red')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
