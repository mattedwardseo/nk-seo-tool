import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check users
  const users = await prisma.users.findMany({
    select: { id: true, email: true, name: true },
  })
  console.log('=== USERS ===')
  console.log(JSON.stringify(users, null, 2))

  // Check recent audits
  const audits = await prisma.audits.findMany({
    select: {
      id: true,
      domain: true,
      status: true,
      userId: true,
      createdAt: true,
      error_message: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  console.log('\n=== RECENT AUDITS ===')
  console.log(JSON.stringify(audits, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
