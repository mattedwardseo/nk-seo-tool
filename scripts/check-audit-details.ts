import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const audit = await prisma.audits.findFirst({
    where: { id: 'cmiia86210001ye5wdj27e967' },
    select: {
      step_results: true,
    },
  })

  if (!audit?.step_results) {
    console.log('No step results found')
    return
  }

  const results = audit.step_results as Record<string, Record<string, unknown>>

  console.log('=== ONPAGE DATA ===')
  console.log(JSON.stringify(results.onPage, null, 2))

  console.log('\n=== SERP DATA ===')
  console.log(JSON.stringify(results.serp, null, 2))

  console.log('\n=== BACKLINKS DATA ===')
  console.log(JSON.stringify(results.backlinks, null, 2))

  console.log('\n=== BUSINESS DATA ===')
  console.log(JSON.stringify(results.business, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
