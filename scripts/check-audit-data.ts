import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const audit = await prisma.audits.findFirst({
    where: { id: 'cmiia86210001ye5wdj27e967' },
    select: {
      id: true,
      domain: true,
      status: true,
      step_results: true,
    },
  })

  if (!audit) {
    console.log('Audit not found')
    return
  }

  console.log('=== AUDIT SUMMARY ===')
  console.log(`Domain: ${audit.domain}`)
  console.log(`Status: ${audit.status}`)

  console.log('\n=== STEP RESULTS KEYS ===')
  const stepResults = audit.step_results as Record<string, unknown>
  if (stepResults) {
    console.log('Keys:', Object.keys(stepResults))

    // Show what's in each step
    for (const [key, value] of Object.entries(stepResults)) {
      console.log(`\n--- ${key} ---`)
      if (value && typeof value === 'object') {
        console.log('Sub-keys:', Object.keys(value as Record<string, unknown>))
      } else {
        console.log('Value:', value)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
