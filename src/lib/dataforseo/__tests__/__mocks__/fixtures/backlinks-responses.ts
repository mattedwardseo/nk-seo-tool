/**
 * Backlinks API Response Fixtures
 */

import type { BacklinksSummaryResult } from '../../../types'

export const mockBacklinksSummary: BacklinksSummaryResult = {
  target: 'example.com',
  first_seen: '2020-01-15',
  rank: 450,
  backlinks: 15420,
  backlinks_spam_score: 12,
  crawled_pages: 1250,
  info: {
    server: 'nginx',
    ip_address: '93.184.216.34',
    country: 'US',
    target_spam_score: 8,
  },
  internal_links_count: 2340,
  external_links_count: 890,
  broken_backlinks: 45,
  broken_pages: 12,
  referring_domains: 1820,
  referring_domains_nofollow: 340,
  referring_main_domains: 1650,
  referring_main_domains_nofollow: 290,
  referring_ips: 980,
  referring_subnets: 720,
  referring_pages: 12500,
  referring_pages_nofollow: 2100,
  referring_links_tld: {
    com: 8500,
    org: 2100,
    net: 1200,
    edu: 450,
    gov: 120,
  },
  referring_links_types: {
    anchor: 11000,
    image: 2800,
    form: 50,
    canonical: 1200,
  },
  referring_links_attributes: {
    nofollow: 2100,
    sponsored: 180,
    ugc: 95,
  },
  referring_links_platform_types: {
    cms: 6500,
    blogs: 3200,
    ecommerce: 1800,
    forums: 900,
  },
  referring_links_semantic_locations: {
    article: 7500,
    sidebar: 2800,
    footer: 1200,
    header: 800,
  },
  referring_links_countries: {
    US: 8200,
    UK: 2100,
    CA: 1500,
    AU: 800,
    DE: 650,
  },
}

export const mockBacklinkItem = {
  type: 'backlink',
  domain_from: 'referrer.com',
  url_from: 'https://referrer.com/article/seo-tips',
  url_to: 'https://example.com/guide',
  domain_to: 'example.com',
  tld_from: 'com',
  page_from_rank: 85,
  domain_from_rank: 72,
  dofollow: true,
  anchor: 'SEO best practices',
  text_pre: 'Check out this guide on',
  text_post: 'for more information.',
  first_seen: '2023-06-15',
  prev_seen: '2024-01-10',
  last_seen: '2024-11-20',
  is_lost: false,
  backlink_spam_score: 5,
  item_type: 'anchor',
  attributes: [],
  image_url: null,
}

export const mockAnchorResult = {
  anchor: 'SEO tips',
  backlinks: 250,
  first_seen: '2022-03-10',
  last_seen: '2024-11-18',
  rank: 68,
  referring_domains: 45,
  referring_main_domains: 42,
  referring_pages: 180,
}

export const mockReferringDomainResult = {
  type: 'referring_domains',
  domain: 'referrer-site.com',
  rank: 75,
  backlinks: 12,
  first_seen: '2022-01-15',
  lost_date: null,
  backlinks_spam_score: 8,
  referring_ips: 2,
  referring_pages: 10,
  referring_subnets: 2,
}

export const mockCompetitorResult = {
  domain: 'competitor.com',
  intersections: 450,
  rank: 520,
}

export const mockSpamScoreResult = {
  target: 'example.com',
  spam_score: 12,
}
