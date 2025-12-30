/**
 * Seed a test user for development/testing
 * Run: npx tsx scripts/seed-user.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Generate a simple unique ID (similar to cuid)
function generateId(): string {
  return randomBytes(12).toString('base64url')
}

const TEST_PASSWORD = 'password123'

async function main() {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10)

  // Check if test user already exists
  const existingUser = await prisma.users.findUnique({
    where: { email: 'test@example.com' },
  })

  if (existingUser) {
    // Update password if user exists but has no password
    if (!existingUser.password) {
      await prisma.users.update({
        where: { email: 'test@example.com' },
        data: { password: hashedPassword },
      })
      console.log('Updated test user with password:')
    } else {
      console.log('Test user already exists:')
    }
    console.log(`  ID: ${existingUser.id}`)
    console.log(`  Email: ${existingUser.email}`)
    console.log(`  Password: ${TEST_PASSWORD}`)
    return existingUser
  }

  // Create test user
  const user = await prisma.users.create({
    data: {
      id: generateId(),
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      updatedAt: new Date(),
    },
  })

  console.log('Created test user:')
  console.log(`  ID: ${user.id}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Password: ${TEST_PASSWORD}`)

  return user
}

main()
  .catch((e) => {
    console.error('Error seeding user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
