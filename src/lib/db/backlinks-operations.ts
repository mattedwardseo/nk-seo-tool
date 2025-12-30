/**
 * Backlinks Database Operations
 *
 * Domain-scoped backlink profile CRUD operations.
 * Used by `/api/backlinks/` routes and backlinks pages.
 */

import { prisma } from '@/lib/prisma'
import { getDataForSEOClient } from '@/lib/dataforseo'
import { BacklinksModule } from '@/lib/dataforseo/modules/backlinks'

// ============================================
// Types
// ============================================

export interface BacklinkProfile {
  id: string
  domainId: string
  totalBacklinks: number
  referringDomainsCount: number
  domainRank: number
  spamScore: number
  targetSpamScore: number | null
  dofollowRatio: number
  dofollowBacklinks: number
  nofollowBacklinks: number
  newBacklinks30d: number | null
  lostBacklinks30d: number | null
  newReferring30d: number | null
  lostReferring30d: number | null
  fetchedAt: string
  createdAt: string
  updatedAt: string
  referringDomains?: ReferringDomain[]
  anchors?: AnchorData[]
}

export interface ReferringDomain {
  id: string
  domain: string
  backlinks: number
  domainRank: number
  firstSeen: string | null
  dofollow: number
  nofollow: number
}

export interface AnchorData {
  id: string
  anchor: string
  backlinks: number
  referringDomains: number
  dofollow: number
  nofollow: number
}

export interface BacklinkProfileInput {
  domainId: string
  totalBacklinks: number
  referringDomainsCount: number
  domainRank: number
  spamScore: number
  targetSpamScore?: number | null
  dofollowRatio: number
  dofollowBacklinks?: number
  nofollowBacklinks?: number
  newBacklinks30d?: number | null
  lostBacklinks30d?: number | null
  newReferring30d?: number | null
  lostReferring30d?: number | null
}

export interface ReferringDomainInput {
  domain: string
  backlinks: number
  domainRank: number
  firstSeen?: Date | null
  dofollow?: number
  nofollow?: number
}

export interface AnchorInput {
  anchor: string
  backlinks: number
  referringDomains?: number
  dofollow?: number
  nofollow?: number
}

// ============================================
// Profile Operations
// ============================================

/**
 * Get backlink profile for a domain
 */
export async function getBacklinkProfile(
  domainId: string,
  includeDetails: boolean = false
): Promise<BacklinkProfile | null> {
  const profile = await prisma.backlink_profiles.findUnique({
    where: { domain_id: domainId },
    include: {
      referring_domains: includeDetails
        ? {
            orderBy: { domain_rank: 'desc' },
            take: 50,
          }
        : false,
      anchors: includeDetails
        ? {
            orderBy: { backlinks: 'desc' },
            take: 20,
          }
        : false,
    },
  })

  if (!profile) return null

  return transformProfile(profile)
}

/**
 * Save or update backlink profile for a domain
 */
export async function saveBacklinkProfile(
  input: BacklinkProfileInput,
  referringDomains?: ReferringDomainInput[],
  anchors?: AnchorInput[]
): Promise<BacklinkProfile> {
  // Upsert the profile
  const profile = await prisma.backlink_profiles.upsert({
    where: { domain_id: input.domainId },
    create: {
      domain_id: input.domainId,
      total_backlinks: input.totalBacklinks,
      referring_domains_count: input.referringDomainsCount,
      domain_rank: input.domainRank,
      spam_score: input.spamScore,
      target_spam_score: input.targetSpamScore,
      dofollow_ratio: input.dofollowRatio,
      dofollow_backlinks: input.dofollowBacklinks ?? 0,
      nofollow_backlinks: input.nofollowBacklinks ?? 0,
      new_backlinks_30d: input.newBacklinks30d,
      lost_backlinks_30d: input.lostBacklinks30d,
      new_referring_30d: input.newReferring30d,
      lost_referring_30d: input.lostReferring30d,
      fetched_at: new Date(),
    },
    update: {
      total_backlinks: input.totalBacklinks,
      referring_domains_count: input.referringDomainsCount,
      domain_rank: input.domainRank,
      spam_score: input.spamScore,
      target_spam_score: input.targetSpamScore,
      dofollow_ratio: input.dofollowRatio,
      dofollow_backlinks: input.dofollowBacklinks ?? 0,
      nofollow_backlinks: input.nofollowBacklinks ?? 0,
      new_backlinks_30d: input.newBacklinks30d,
      lost_backlinks_30d: input.lostBacklinks30d,
      new_referring_30d: input.newReferring30d,
      lost_referring_30d: input.lostReferring30d,
      fetched_at: new Date(),
    },
  })

  // If referring domains provided, delete old and insert new
  if (referringDomains && referringDomains.length > 0) {
    await prisma.backlink_referring_domains.deleteMany({
      where: { profile_id: profile.id },
    })

    await prisma.backlink_referring_domains.createMany({
      data: referringDomains.map((rd) => ({
        profile_id: profile.id,
        domain: rd.domain,
        backlinks: rd.backlinks,
        domain_rank: rd.domainRank,
        first_seen: rd.firstSeen,
        dofollow: rd.dofollow ?? 0,
        nofollow: rd.nofollow ?? 0,
      })),
    })
  }

  // If anchors provided, delete old and insert new
  if (anchors && anchors.length > 0) {
    await prisma.backlink_anchors.deleteMany({
      where: { profile_id: profile.id },
    })

    await prisma.backlink_anchors.createMany({
      data: anchors.map((a) => ({
        profile_id: profile.id,
        anchor: a.anchor,
        backlinks: a.backlinks,
        referring_domains: a.referringDomains ?? 0,
        dofollow: a.dofollow ?? 0,
        nofollow: a.nofollow ?? 0,
      })),
    })
  }

  return transformProfile(profile)
}

/**
 * Delete backlink profile for a domain
 */
export async function deleteBacklinkProfile(domainId: string): Promise<void> {
  await prisma.backlink_profiles.deleteMany({
    where: { domain_id: domainId },
  })
}

// ============================================
// Referring Domains Operations
// ============================================

/**
 * Get paginated referring domains for a domain
 */
export async function getReferringDomains(
  domainId: string,
  options: {
    page?: number
    pageSize?: number
    sortBy?: 'rank' | 'backlinks'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<{
  domains: ReferringDomain[]
  total: number
  page: number
  pageSize: number
}> {
  const { page = 1, pageSize = 20, sortBy = 'rank', sortOrder = 'desc' } = options

  const profile = await prisma.backlink_profiles.findUnique({
    where: { domain_id: domainId },
    select: { id: true },
  })

  if (!profile) {
    return { domains: [], total: 0, page, pageSize }
  }

  const [domains, total] = await Promise.all([
    prisma.backlink_referring_domains.findMany({
      where: { profile_id: profile.id },
      orderBy: sortBy === 'rank' ? { domain_rank: sortOrder } : { backlinks: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.backlink_referring_domains.count({
      where: { profile_id: profile.id },
    }),
  ])

  return {
    domains: domains.map(transformReferringDomain),
    total,
    page,
    pageSize,
  }
}

// ============================================
// Anchor Operations
// ============================================

/**
 * Get anchors for a domain
 */
export async function getAnchors(
  domainId: string,
  limit: number = 20
): Promise<AnchorData[]> {
  const profile = await prisma.backlink_profiles.findUnique({
    where: { domain_id: domainId },
    select: { id: true },
  })

  if (!profile) return []

  const anchors = await prisma.backlink_anchors.findMany({
    where: { profile_id: profile.id },
    orderBy: { backlinks: 'desc' },
    take: limit,
  })

  return anchors.map(transformAnchor)
}

// ============================================
// Fetch & Refresh Operations
// ============================================

/**
 * Fetch fresh backlink data from DataForSEO and save to database
 */
export async function refreshBacklinkProfile(
  domainId: string,
  targetDomain: string
): Promise<BacklinkProfile> {
  const client = getDataForSEOClient()
  const backlinksModule = new BacklinksModule(client)

  // Get summary
  const summary = await backlinksModule.getSummary({
    target: targetDomain,
    includeSubdomains: true,
  })

  if (!summary) {
    throw new Error('Failed to fetch backlink summary from DataForSEO')
  }

  // Calculate dofollow ratio from referring domains
  const nofollowDomains = summary.referring_domains_nofollow ?? 0
  const totalDomains = summary.referring_domains ?? 0
  const dofollowDomains = totalDomains - nofollowDomains
  const dofollowRatio = totalDomains > 0 ? dofollowDomains / totalDomains : 0

  // Get top referring domains
  let referringDomains: ReferringDomainInput[] = []
  try {
    const rdResponse = await backlinksModule.getReferringDomains({
      target: targetDomain,
      includeSubdomains: true,
      orderBy: 'rank_desc',
      limit: 50,
    })

    referringDomains = rdResponse.map((rd) => {
      // Calculate dofollow/nofollow from referring pages if available
      const totalPages = rd.referring_pages ?? 0
      const nofollowPages = rd.referring_pages_nofollow ?? 0
      const dofollowPages = totalPages - nofollowPages

      return {
        domain: rd.domain ?? '',
        backlinks: rd.backlinks ?? 0,
        domainRank: rd.rank ?? 0,
        firstSeen: rd.first_seen ? new Date(rd.first_seen) : null,
        dofollow: dofollowPages,
        nofollow: nofollowPages,
      }
    })
  } catch (error) {
    console.warn('Failed to fetch referring domains:', error)
  }

  // Get anchor distribution
  let anchors: AnchorInput[] = []
  try {
    const anchorResponse = await backlinksModule.getAnchors({
      target: targetDomain,
      includeSubdomains: true,
      limit: 30,
    })

    anchors = anchorResponse.map((a) => ({
      anchor: a.anchor ?? '',
      backlinks: a.backlinks ?? 0,
      referringDomains: a.referring_domains ?? 0,
      // Anchor API doesn't provide dofollow/nofollow breakdown
      dofollow: 0,
      nofollow: 0,
    }))
  } catch (error) {
    console.warn('Failed to fetch anchors:', error)
  }

  // Save to database
  return saveBacklinkProfile(
    {
      domainId,
      totalBacklinks: summary.backlinks ?? 0,
      referringDomainsCount: summary.referring_domains ?? 0,
      domainRank: summary.rank ?? 0,
      spamScore: summary.backlinks_spam_score ?? 0,
      targetSpamScore: summary.info?.target_spam_score ?? null,
      dofollowRatio,
      // Estimate dofollow/nofollow backlinks from domain ratio
      dofollowBacklinks: Math.round((summary.backlinks ?? 0) * dofollowRatio),
      nofollowBacklinks: Math.round((summary.backlinks ?? 0) * (1 - dofollowRatio)),
      // DataForSEO may not provide new/lost stats depending on plan
      newBacklinks30d: null,
      lostBacklinks30d: null,
      newReferring30d: null,
      lostReferring30d: null,
    },
    referringDomains,
    anchors
  )
}

// ============================================
// Competitor Gap Analysis
// ============================================

export interface CompetitorBacklinkData {
  domain: string
  totalBacklinks: number
  referringDomains: number
  domainRank: number
}

export interface BacklinkGapResult {
  clientDomain: string
  clientBacklinks: number
  clientReferringDomains: number
  competitors: CompetitorBacklinkData[]
  gapDomains: Array<{
    domain: string
    backlinks: number
    domainRank: number
    linksToCompetitors: string[]
  }>
  summary: {
    avgCompetitorBacklinks: number
    avgCompetitorReferringDomains: number
    backlinkGap: number
    referringDomainGap: number
  }
}

/**
 * Get backlink gap analysis comparing domain to competitors
 */
export async function getBacklinkGapAnalysis(
  domainId: string,
  competitorDomains: string[]
): Promise<BacklinkGapResult | null> {
  // Get client profile
  const profile = await getBacklinkProfile(domainId)
  if (!profile) return null

  // Get domain info to find the actual domain name
  const domainInfo = await prisma.domains.findUnique({
    where: { id: domainId },
    select: { domain: true },
  })

  if (!domainInfo) return null

  const client = getDataForSEOClient()
  const backlinksModule = new BacklinksModule(client)

  // Fetch competitor backlink summaries
  const competitors: CompetitorBacklinkData[] = []
  for (const compDomain of competitorDomains.slice(0, 5)) {
    try {
      const summary = await backlinksModule.getSummary({
        target: compDomain,
        includeSubdomains: true,
      })

      if (summary) {
        competitors.push({
          domain: compDomain,
          totalBacklinks: summary.backlinks ?? 0,
          referringDomains: summary.referring_domains ?? 0,
          domainRank: summary.rank ?? 0,
        })
      }
    } catch (error) {
      console.warn(`Failed to fetch backlinks for competitor ${compDomain}:`, error)
    }
  }

  // Calculate averages
  const avgCompetitorBacklinks =
    competitors.length > 0
      ? Math.round(
          competitors.reduce((sum, c) => sum + c.totalBacklinks, 0) / competitors.length
        )
      : 0

  const avgCompetitorReferringDomains =
    competitors.length > 0
      ? Math.round(
          competitors.reduce((sum, c) => sum + c.referringDomains, 0) / competitors.length
        )
      : 0

  return {
    clientDomain: domainInfo.domain,
    clientBacklinks: profile.totalBacklinks,
    clientReferringDomains: profile.referringDomainsCount,
    competitors,
    gapDomains: [], // Would need domain intersection API for this
    summary: {
      avgCompetitorBacklinks,
      avgCompetitorReferringDomains,
      backlinkGap: avgCompetitorBacklinks - profile.totalBacklinks,
      referringDomainGap: avgCompetitorReferringDomains - profile.referringDomainsCount,
    },
  }
}

// ============================================
// Transform Functions
// ============================================

function transformProfile(profile: {
  id: string
  domain_id: string
  total_backlinks: number
  referring_domains_count: number
  domain_rank: number
  spam_score: number
  target_spam_score: number | null
  dofollow_ratio: unknown
  dofollow_backlinks: number
  nofollow_backlinks: number
  new_backlinks_30d: number | null
  lost_backlinks_30d: number | null
  new_referring_30d: number | null
  lost_referring_30d: number | null
  fetched_at: Date
  created_at: Date
  updated_at: Date
  referring_domains?: Array<{
    id: string
    domain: string
    backlinks: number
    domain_rank: number
    first_seen: Date | null
    dofollow: number
    nofollow: number
  }>
  anchors?: Array<{
    id: string
    anchor: string
    backlinks: number
    referring_domains: number
    dofollow: number
    nofollow: number
  }>
}): BacklinkProfile {
  return {
    id: profile.id,
    domainId: profile.domain_id,
    totalBacklinks: profile.total_backlinks,
    referringDomainsCount: profile.referring_domains_count,
    domainRank: profile.domain_rank,
    spamScore: profile.spam_score,
    targetSpamScore: profile.target_spam_score,
    dofollowRatio: Number(profile.dofollow_ratio),
    dofollowBacklinks: profile.dofollow_backlinks,
    nofollowBacklinks: profile.nofollow_backlinks,
    newBacklinks30d: profile.new_backlinks_30d,
    lostBacklinks30d: profile.lost_backlinks_30d,
    newReferring30d: profile.new_referring_30d,
    lostReferring30d: profile.lost_referring_30d,
    fetchedAt: profile.fetched_at.toISOString(),
    createdAt: profile.created_at.toISOString(),
    updatedAt: profile.updated_at.toISOString(),
    referringDomains: profile.referring_domains?.map(transformReferringDomain),
    anchors: profile.anchors?.map(transformAnchor),
  }
}

function transformReferringDomain(rd: {
  id: string
  domain: string
  backlinks: number
  domain_rank: number
  first_seen: Date | null
  dofollow: number
  nofollow: number
}): ReferringDomain {
  return {
    id: rd.id,
    domain: rd.domain,
    backlinks: rd.backlinks,
    domainRank: rd.domain_rank,
    firstSeen: rd.first_seen?.toISOString() ?? null,
    dofollow: rd.dofollow,
    nofollow: rd.nofollow,
  }
}

function transformAnchor(a: {
  id: string
  anchor: string
  backlinks: number
  referring_domains: number
  dofollow: number
  nofollow: number
}): AnchorData {
  return {
    id: a.id,
    anchor: a.anchor,
    backlinks: a.backlinks,
    referringDomains: a.referring_domains,
    dofollow: a.dofollow,
    nofollow: a.nofollow,
  }
}
