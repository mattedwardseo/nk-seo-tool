import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get most recent completed audit
  const audit = await prisma.audits.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      domain: true,
      status: true,
      createdAt: true,
      step_results: true,
    },
  })

  if (!audit) {
    console.log('No completed audits found')
    return
  }

  console.log('=== MOST RECENT COMPLETED AUDIT ===')
  console.log(`ID: ${audit.id}`)
  console.log(`Domain: ${audit.domain}`)
  console.log(`Created: ${audit.createdAt}`)

  const stepResults = audit.step_results as Record<string, unknown>
  const onPage = stepResults?.onPage as Record<string, unknown> | undefined

  if (!onPage) {
    console.log('\n❌ No onPage data found')
    return
  }

  console.log('\n=== ONPAGE DATA ===')
  console.log('Keys:', Object.keys(onPage))

  // Check meta
  const meta = onPage.meta as Record<string, unknown> | undefined
  if (meta) {
    console.log('\n--- META ---')
    console.log('Title:', meta.title)
    console.log('Description:', meta.description ? (meta.description as string).slice(0, 50) + '...' : null)
    console.log('H-tags:', meta.htags)
    console.log('Meta keys:', Object.keys(meta))
  } else {
    console.log('\n❌ meta is null/undefined')
  }

  // Check pageInfo
  const pageInfo = onPage.pageInfo as Record<string, unknown> | undefined
  if (pageInfo) {
    console.log('\n--- PAGE INFO ---')
    console.log('pageInfo:', JSON.stringify(pageInfo, null, 2))
  } else {
    console.log('\n❌ pageInfo is null/undefined')
  }

  // Check content
  const content = onPage.content as Record<string, unknown> | undefined
  if (content) {
    console.log('\n--- CONTENT ---')
    console.log('Word count:', content.plainTextWordCount)
    console.log('Content keys:', Object.keys(content))
  } else {
    console.log('\n❌ content is null/undefined')
  }

  // Check lighthouse
  const lighthouse = onPage.lighthouse as Record<string, unknown> | undefined
  if (lighthouse) {
    console.log('\n--- LIGHTHOUSE ---')
    console.log('Lighthouse keys:', Object.keys(lighthouse))
  } else {
    console.log('\n❌ lighthouse is null/undefined')
  }

  // Full dump of onPage for debugging
  console.log('\n=== FULL ONPAGE JSON ===')
  console.log(JSON.stringify(onPage, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
