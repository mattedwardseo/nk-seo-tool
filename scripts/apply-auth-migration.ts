/**
 * Apply auth tables migration using raw SQL
 * This bypasses Prisma's schema sync issues with TimescaleDB hypertables
 */

import { prisma } from '../src/lib/prisma'

async function applyAuthMigration(): Promise<void> {
  console.log('Applying auth tables migration...\n')

  try {
    // Add new columns to users table
    console.log('1. Adding columns to users table...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
    `)
    console.log('   Done.\n')

    // Create accounts table
    console.log('2. Creating accounts table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)
    `)
    console.log('   Done.\n')

    // Create sessions table
    console.log('3. Creating sessions table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        session_token TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
    `)
    console.log('   Done.\n')

    // Create verification_tokens table
    console.log('4. Creating verification_tokens table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMPTZ NOT NULL,
        UNIQUE(identifier, token)
      )
    `)
    console.log('   Done.\n')

    // Verify tables exist
    console.log('5. Verifying tables...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'accounts', 'sessions', 'verification_tokens')
    `
    console.log('   Found tables:', tables.map(t => t.tablename).join(', '))

    // Check users table columns
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('password', 'email_verified', 'image')
    `
    console.log('   Users table has columns:', columns.map(c => c.column_name).join(', '))

    console.log('\nAuth migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyAuthMigration()
