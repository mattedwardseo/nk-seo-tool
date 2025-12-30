/**
 * E2E Audit Trigger Script
 *
 * Creates a test user and triggers a full audit via the API.
 * Run with: npx tsx scripts/trigger-audit.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { prisma } from '../src/lib/prisma'
import { randomBytes } from 'crypto'

const BASE_URL = 'http://localhost:3000'

// Generate a simple unique ID
function generateId(): string {
  return randomBytes(12).toString('base64url')
}

// Colors for terminal output
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

async function createTestUser(): Promise<string> {
  log('\n1. Creating test user...', 'cyan')

  const user = await prisma.users.upsert({
    where: { email: 'e2e-test@verification.local' },
    create: {
      id: generateId(),
      email: 'e2e-test@verification.local',
      name: 'E2E Test User',
      updatedAt: new Date(),
    },
    update: {},
  })

  log(`   User ID: ${user.id}`, 'dim')
  return user.id
}

async function triggerAudit(userId: string): Promise<string> {
  log('\n2. Triggering audit via POST /api/audits...', 'cyan')
  log('   Domain: example.com', 'dim')

  const response = await fetch(`${BASE_URL}/api/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: 'example.com',
      userId: userId,
      options: {
        skipCache: true,
        keywords: ['example domain'],
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to create audit: ${JSON.stringify(data)}`)
  }

  log(`   ${colors.green}✓${colors.reset} Audit created!`)
  log(`   Audit ID: ${data.data.auditId}`, 'dim')
  log(`   Status: ${data.data.status}`, 'dim')

  return data.data.auditId
}

async function pollStatus(auditId: string): Promise<void> {
  log('\n3. Polling audit status...', 'cyan')
  log('   (Ctrl+C to stop polling)\n', 'dim')

  let lastStatus = ''
  let lastProgress = -1
  let pollCount = 0
  const maxPolls = 60 // Max 2 minutes (2s intervals)

  while (pollCount < maxPolls) {
    try {
      const response = await fetch(`${BASE_URL}/api/audits/${auditId}/status`)
      const data = await response.json()

      if (!response.ok) {
        log(`   Error polling: ${JSON.stringify(data)}`, 'red')
        break
      }

      const status = data.data

      // Only log if something changed
      if (status.status !== lastStatus || status.progress !== lastProgress) {
        const progressBar = createProgressBar(status.progress)
        log(`   ${progressBar} ${status.progress}% - ${status.status}`)

        if (status.currentStepDescription) {
          log(`   └─ ${status.currentStepDescription}`, 'dim')
        }

        lastStatus = status.status
        lastProgress = status.progress
      }

      // Check if complete or failed
      if (status.isComplete) {
        log(`\n${colors.green}✓ Audit completed!${colors.reset}`)
        await showResults(auditId)
        return
      }

      if (status.isFailed) {
        log(`\n${colors.red}✗ Audit failed${colors.reset}`)
        await showResults(auditId)
        return
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000))
      pollCount++

    } catch (error) {
      log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`, 'red')
      break
    }
  }

  if (pollCount >= maxPolls) {
    log('\n   Timeout - audit still in progress after 2 minutes', 'yellow')
    log('   Check Inngest dashboard at http://localhost:8288', 'yellow')
  }
}

function createProgressBar(progress: number): string {
  const total = 20
  const filled = Math.round((progress / 100) * total)
  const empty = total - filled
  return `[${colors.green}${'█'.repeat(filled)}${colors.reset}${'░'.repeat(empty)}]`
}

async function showResults(auditId: string): Promise<void> {
  log('\n4. Fetching full results...', 'cyan')

  const response = await fetch(`${BASE_URL}/api/audits/${auditId}`)
  const data = await response.json()

  if (!response.ok) {
    log(`   Error: ${JSON.stringify(data)}`, 'red')
    return
  }

  const audit = data.data

  log('\n╔════════════════════════════════════════════════════╗', 'green')
  log('║              AUDIT RESULTS                         ║', 'green')
  log('╚════════════════════════════════════════════════════╝', 'green')

  log(`\nDomain: ${audit.domain}`)
  log(`Status: ${audit.status}`)
  log(`Duration: ${calculateDuration(audit.startedAt, audit.completedAt)}`)

  if (audit.scores) {
    log('\n--- Scores ---', 'cyan')
    log(`Overall:    ${formatScore(audit.scores.overall)}`)
    log(`Technical:  ${formatScore(audit.scores.technical)}`)
    log(`Content:    ${formatScore(audit.scores.content)}`)
    log(`Local:      ${formatScore(audit.scores.local)}`)
    log(`Backlinks:  ${formatScore(audit.scores.backlinks)}`)
  }

  if (audit.stepResults) {
    log('\n--- Step Results ---', 'cyan')

    if (audit.stepResults.onPage) {
      log('\nOnPage:', 'yellow')
      log(`  OnPage Score: ${audit.stepResults.onPage.onpageScore ?? 'N/A'}`)
      log(`  Lighthouse Performance: ${audit.stepResults.onPage.lighthousePerformance ?? 'N/A'}`)
      log(`  Lighthouse SEO: ${audit.stepResults.onPage.lighthouseSeo ?? 'N/A'}`)
    }

    if (audit.stepResults.backlinks) {
      log('\nBacklinks:', 'yellow')
      log(`  Total Backlinks: ${audit.stepResults.backlinks.totalBacklinks?.toLocaleString() ?? 'N/A'}`)
      log(`  Referring Domains: ${audit.stepResults.backlinks.referringDomains?.toLocaleString() ?? 'N/A'}`)
      log(`  Domain Rank: ${audit.stepResults.backlinks.domainRank ?? 'N/A'}`)
      log(`  Spam Score: ${audit.stepResults.backlinks.spamScore ?? 'N/A'}`)
    }

    if (audit.stepResults.serp) {
      log('\nSERP:', 'yellow')
      log(`  Keywords Tracked: ${audit.stepResults.serp.keywordsTracked ?? 'N/A'}`)
      log(`  Avg Position: ${audit.stepResults.serp.avgPosition ?? 'N/A'}`)
      log(`  Top 10 Count: ${audit.stepResults.serp.top10Count ?? 'N/A'}`)
    }

    if (audit.stepResults.business) {
      log('\nBusiness:', 'yellow')
      log(`  GMB Listing: ${audit.stepResults.business.hasGmbListing ?? 'N/A'}`)
      log(`  Review Count: ${audit.stepResults.business.reviewCount ?? 'N/A'}`)
    }
  }

  if (audit.warnings && audit.warnings.length > 0) {
    log('\n--- Warnings ---', 'yellow')
    audit.warnings.forEach((w: string) => log(`  ⚠ ${w}`))
  }

  log('\n')
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A'

  let color = colors.red
  if (score >= 80) color = colors.green
  else if (score >= 60) color = colors.yellow

  return `${color}${score}${colors.reset}/100`
}

function calculateDuration(start: string | null, end: string | null): string {
  if (!start || !end) return 'N/A'

  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()

  const seconds = Math.round(diffMs / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

async function main(): Promise<void> {
  console.log(`${colors.bold}`)
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║          E2E Audit Test - Full Pipeline                  ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(colors.reset)

  log('This will trigger a real audit using DataForSEO API.', 'yellow')
  log('Estimated cost: ~$0.10 in API credits\n', 'yellow')

  try {
    // Step 1: Create test user
    const userId = await createTestUser()

    // Step 2: Trigger audit
    const auditId = await triggerAudit(userId)

    // Step 3: Poll status until complete
    await pollStatus(auditId)

  } catch (error) {
    log(`\nError: ${error instanceof Error ? error.message : 'Unknown'}`, 'red')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
