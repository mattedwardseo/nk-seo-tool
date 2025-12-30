import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Generate a unique ID
function generateId(): string {
  return randomBytes(12).toString('base64url')
}

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? 'Validation failed' },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.users.create({
      data: {
        id: generateId(),
        name,
        email,
        password: hashedPassword,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, error: 'Failed to register user' }, { status: 500 })
  }
}
