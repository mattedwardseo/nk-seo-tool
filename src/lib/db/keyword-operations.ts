/**
 * Keyword Database Operations
 *
 * CRUD operations for tracked keywords per domain.
 * Keywords are saved per user+domain and reused across audits.
 */

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import type { tracked_keywords } from '@prisma/client'

/**
 * Normalize domain for consistent storage
 * Removes protocol, www, and trailing slashes
 */
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

/**
 * Get all active tracked keywords for a user's domain
 */
export async function getTrackedKeywords(
  userId: string,
  domain: string
): Promise<tracked_keywords[]> {
  const normalizedDomain = normalizeDomain(domain)

  return prisma.tracked_keywords.findMany({
    where: {
      user_id: userId,
      domain: normalizedDomain,
      is_active: true,
    },
    orderBy: {
      created_at: 'asc',
    },
  })
}

/**
 * Get all tracked keywords for a user's domain (including inactive)
 */
export async function getAllTrackedKeywords(
  userId: string,
  domain: string
): Promise<tracked_keywords[]> {
  const normalizedDomain = normalizeDomain(domain)

  return prisma.tracked_keywords.findMany({
    where: {
      user_id: userId,
      domain: normalizedDomain,
    },
    orderBy: {
      created_at: 'asc',
    },
  })
}

/**
 * Get all domains a user has tracked keywords for
 */
export async function getUserTrackedDomains(userId: string): Promise<string[]> {
  const results = await prisma.tracked_keywords.findMany({
    where: {
      user_id: userId,
      is_active: true,
    },
    select: {
      domain: true,
    },
    distinct: ['domain'],
    orderBy: {
      domain: 'asc',
    },
  })

  return results.map((r) => r.domain)
}

/**
 * Add a single keyword to track for a domain
 * Returns the created or existing keyword
 */
export async function addTrackedKeyword(
  userId: string,
  domain: string,
  keyword: string
): Promise<tracked_keywords> {
  const normalizedDomain = normalizeDomain(domain)
  const normalizedKeyword = keyword.toLowerCase().trim()

  // Upsert - if keyword exists but was deactivated, reactivate it
  return prisma.tracked_keywords.upsert({
    where: {
      user_id_domain_keyword: {
        user_id: userId,
        domain: normalizedDomain,
        keyword: normalizedKeyword,
      },
    },
    update: {
      is_active: true,
      updated_at: new Date(),
    },
    create: {
      id: createId(),
      user_id: userId,
      domain: normalizedDomain,
      keyword: normalizedKeyword,
      updated_at: new Date(),
    },
  })
}

/**
 * Add multiple keywords to track for a domain
 * Returns count of keywords added/reactivated
 */
export async function addTrackedKeywords(
  userId: string,
  domain: string,
  keywords: string[]
): Promise<{ added: number; existing: number }> {
  const normalizedDomain = normalizeDomain(domain)
  let added = 0
  let existing = 0

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim()
    if (!normalizedKeyword) continue

    try {
      const result = await prisma.tracked_keywords.upsert({
        where: {
          user_id_domain_keyword: {
            user_id: userId,
            domain: normalizedDomain,
            keyword: normalizedKeyword,
          },
        },
        update: {
          is_active: true,
          updated_at: new Date(),
        },
        create: {
          id: createId(),
          user_id: userId,
          domain: normalizedDomain,
          keyword: normalizedKeyword,
          updated_at: new Date(),
        },
      })

      // Check if this was a new creation or an update
      if (result.created_at.getTime() === result.updated_at.getTime()) {
        added++
      } else {
        existing++
      }
    } catch {
      // Skip duplicates or errors
      existing++
    }
  }

  return { added, existing }
}

/**
 * Remove a tracked keyword (soft delete - sets is_active to false)
 */
export async function removeTrackedKeyword(
  userId: string,
  keywordId: string
): Promise<tracked_keywords | null> {
  // First verify the keyword belongs to this user
  const keyword = await prisma.tracked_keywords.findFirst({
    where: {
      id: keywordId,
      user_id: userId,
    },
  })

  if (!keyword) {
    return null
  }

  return prisma.tracked_keywords.update({
    where: { id: keywordId },
    data: { is_active: false },
  })
}

/**
 * Hard delete a tracked keyword
 */
export async function deleteTrackedKeyword(
  userId: string,
  keywordId: string
): Promise<boolean> {
  const result = await prisma.tracked_keywords.deleteMany({
    where: {
      id: keywordId,
      user_id: userId,
    },
  })

  return result.count > 0
}

/**
 * Toggle a keyword's active status
 */
export async function toggleTrackedKeyword(
  userId: string,
  keywordId: string
): Promise<tracked_keywords | null> {
  const keyword = await prisma.tracked_keywords.findFirst({
    where: {
      id: keywordId,
      user_id: userId,
    },
  })

  if (!keyword) {
    return null
  }

  return prisma.tracked_keywords.update({
    where: { id: keywordId },
    data: { is_active: !keyword.is_active },
  })
}

/**
 * Remove all tracked keywords for a domain (soft delete)
 */
export async function clearDomainKeywords(
  userId: string,
  domain: string
): Promise<number> {
  const normalizedDomain = normalizeDomain(domain)

  const result = await prisma.tracked_keywords.updateMany({
    where: {
      user_id: userId,
      domain: normalizedDomain,
    },
    data: { is_active: false },
  })

  return result.count
}

/**
 * Get keyword count for a domain
 */
export async function getKeywordCount(
  userId: string,
  domain: string
): Promise<{ active: number; total: number }> {
  const normalizedDomain = normalizeDomain(domain)

  const [active, total] = await Promise.all([
    prisma.tracked_keywords.count({
      where: {
        user_id: userId,
        domain: normalizedDomain,
        is_active: true,
      },
    }),
    prisma.tracked_keywords.count({
      where: {
        user_id: userId,
        domain: normalizedDomain,
      },
    }),
  ])

  return { active, total }
}
