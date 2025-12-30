import { prisma } from '../src/lib/prisma'

async function verify(): Promise<void> {
  console.log('Verifying database tables...\n')

  // Check tables
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `
  console.log('Tables found:', tables.map(t => t.tablename).join(', '))

  // Check users columns
  const userCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY column_name
  `
  console.log('\nUsers table columns:', userCols.map(c => c.column_name).join(', '))

  await prisma.$disconnect()
}

verify().catch(console.error)
