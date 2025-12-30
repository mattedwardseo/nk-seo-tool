/**
 * Top 200 SEO Factors from Cora SEO Software
 * 
 * Data source: Community-shared anonymized data from Cora SEO Software users
 * Correlation coefficients range from -1 to +1, closer to -1 = stronger correlation
 * 
 * Key metrics:
 * - #1 Max: Maximum factor measurement found in the #1 spot this month
 * - Page 1 Avg: Page 1 average factor measurement this month
 * - Usage %: What percentage of top 100 is using this factor
 * - Searches %: What percentage of searches had this factor as significant
 */

export interface SEOFactor {
  rank: number
  name: string
  factorId: string
  url: string
  type: 'Diversity' | 'Relevancy' | 'Authority' | 'Performance' | 'Size' | 'Technology' | 'Trust' | 'Other' | ''
  correlation: number
  maxValue: number | string
  page1Avg: number | string
  usagePercent: number
  searchesPercent: number
  description?: string
  recommendation?: string
}

export const SEO_FACTOR_TYPES = [
  'Diversity',
  'Relevancy',
  'Authority',
  'Performance',
  'Size',
  'Technology',
  'Trust',
  'Other',
] as const

export type SEOFactorType = typeof SEO_FACTOR_TYPES[number]

/**
 * Top 200 SEO Factors - Parsed from TOPSEOFACTORS data
 * Sorted by signal factor ranking (1 = strongest correlation)
 */
export const TOP_200_FACTORS: SEOFactor[] = [
  { rank: 1, name: 'Number of Unique LSI Words Used', factorId: 'LSI000', url: 'https://topseofactors.com/factor.php?id=LSI000', type: 'Diversity', correlation: -0.23, maxValue: 1002, page1Avg: 318, usagePercent: 84, searchesPercent: 82, description: 'Latent Semantic Indexing words that are semantically related to your target keyword', recommendation: 'Use a variety of LSI keywords naturally throughout your content' },
  { rank: 2, name: 'Number of Unique Variations Used', factorId: 'VAR000', url: 'https://topseofactors.com/factor.php?id=VAR000', type: 'Diversity', correlation: -0.22, maxValue: 24, page1Avg: 6, usagePercent: 79, searchesPercent: 88, description: 'Variations of your target keyword (plurals, tenses, etc.)', recommendation: 'Include various forms of your target keyword' },
  { rank: 3, name: 'Number of Distinct Entities Used', factorId: 'ENT000a', url: 'https://topseofactors.com/factor.php?id=ENT000a', type: 'Diversity', correlation: -0.22, maxValue: 63, page1Avg: 30, usagePercent: 79, searchesPercent: 95, description: 'Named entities (people, places, organizations) mentioned in content', recommendation: 'Reference relevant entities in your niche' },
  { rank: 4, name: 'Number of Top 200 Shared Factors Used', factorId: 'CPZZZ200', url: 'https://topseofactors.com/factor.php?id=CPZZZ200', type: 'Diversity', correlation: -0.22, maxValue: 53, page1Avg: 40, usagePercent: 97, searchesPercent: 93 },
  { rank: 5, name: 'Number of Top 100 Shared Factors Used', factorId: 'CPZZZ100', url: 'https://topseofactors.com/factor.php?id=CPZZZ100', type: 'Diversity', correlation: -0.22, maxValue: 39, page1Avg: 30, usagePercent: 97, searchesPercent: 92 },
  { rank: 6, name: 'Entities in Title Tag', factorId: 'ENT009', url: 'https://topseofactors.com/factor.php?id=ENT009', type: 'Relevancy', correlation: -0.22, maxValue: 7, page1Avg: 3, usagePercent: 71, searchesPercent: 94, description: 'Named entities present in your title tag', recommendation: 'Include your business name and location in title tags' },
  { rank: 7, name: 'Number of Top 50 Shared Factors Used', factorId: 'CPZZZ50', url: 'https://topseofactors.com/factor.php?id=CPZZZ50', type: 'Diversity', correlation: -0.21, maxValue: 17, page1Avg: 13, usagePercent: 96, searchesPercent: 92 },
  { rank: 8, name: 'Search Result Domain is .com, .net, or .org', factorId: 'CP079', url: 'https://topseofactors.com/factor.php?id=CP079', type: 'Other', correlation: -0.21, maxValue: 1, page1Avg: 1, usagePercent: 4, searchesPercent: 62 },
  { rank: 9, name: 'Variations in Div Tags', factorId: 'CPX010', url: 'https://topseofactors.com/factor.php?id=CPX010', type: 'Relevancy', correlation: -0.20, maxValue: 52223, page1Avg: 147, usagePercent: 74, searchesPercent: 89 },
  { rank: 10, name: 'Variations in Body Tags', factorId: 'CP134', url: 'https://topseofactors.com/factor.php?id=CP134', type: 'Relevancy', correlation: -0.20, maxValue: 133772, page1Avg: 348, usagePercent: 78, searchesPercent: 88 },
  { rank: 11, name: 'Variations in HTML Tags', factorId: 'CP470', url: 'https://topseofactors.com/factor.php?id=CP470', type: 'Relevancy', correlation: -0.20, maxValue: 133772, page1Avg: 344, usagePercent: 78, searchesPercent: 90 },
  { rank: 12, name: 'Entities in the HTML Tag', factorId: 'ENT001', url: 'https://topseofactors.com/factor.php?id=ENT001', type: 'Relevancy', correlation: -0.19, maxValue: 773, page1Avg: 141, usagePercent: 75, searchesPercent: 94 },
  { rank: 13, name: 'Entities in Sentences', factorId: 'ENT018', url: 'https://topseofactors.com/factor.php?id=ENT018', type: 'Relevancy', correlation: -0.19, maxValue: 630, page1Avg: 138, usagePercent: 72, searchesPercent: 94 },
  { rank: 14, name: 'Variations in H1-H6 Tags', factorId: 'CP161', url: 'https://topseofactors.com/factor.php?id=CP161', type: 'Relevancy', correlation: -0.19, maxValue: 189, page1Avg: 7, usagePercent: 64, searchesPercent: 88, description: 'Keyword variations in heading tags', recommendation: 'Use keyword variations naturally in headings' },
  { rank: 15, name: 'Variations in H1, H2, and H3 Tags', factorId: 'CP157', url: 'https://topseofactors.com/factor.php?id=CP157', type: 'Relevancy', correlation: -0.19, maxValue: 169, page1Avg: 6, usagePercent: 63, searchesPercent: 88 },
  { rank: 16, name: 'Variations in H1 and H2 Tags', factorId: 'CP153', url: 'https://topseofactors.com/factor.php?id=CP153', type: 'Relevancy', correlation: -0.19, maxValue: 78, page1Avg: 4, usagePercent: 60, searchesPercent: 87 },
  { rank: 17, name: 'Variations in P Tags', factorId: 'CP465', url: 'https://topseofactors.com/factor.php?id=CP465', type: 'Relevancy', correlation: -0.19, maxValue: 2754, page1Avg: 32, usagePercent: 67, searchesPercent: 90 },
  { rank: 18, name: 'Search Result Domain is .com', factorId: 'CP078', url: 'https://topseofactors.com/factor.php?id=CP078', type: 'Other', correlation: -0.19, maxValue: 1, page1Avg: 1, usagePercent: 4, searchesPercent: 61 },
  { rank: 19, name: 'Load Time Milliseconds', factorId: 'CP377', url: 'https://topseofactors.com/factor.php?id=CP377', type: 'Performance', correlation: -0.19, maxValue: 23823, page1Avg: 1397, usagePercent: 85, searchesPercent: 88, description: 'Page load time in milliseconds', recommendation: 'Optimize page speed to under 1.5 seconds' },
  { rank: 20, name: 'Variations in Search Result Document File Name', factorId: 'CP072', url: 'https://topseofactors.com/factor.php?id=CP072', type: 'Relevancy', correlation: -0.19, maxValue: 9, page1Avg: 1, usagePercent: 45, searchesPercent: 79 },
  { rank: 21, name: 'Entities in H1 Tags', factorId: 'ENT002', url: 'https://topseofactors.com/factor.php?id=ENT002', type: '', correlation: -0.19, maxValue: 7, page1Avg: 2, usagePercent: 58, searchesPercent: 92, description: 'Named entities in your H1 tag', recommendation: 'Include your primary entity (business name, location) in H1' },
  { rank: 22, name: 'Number of Factors Used', factorId: 'CPZZZ', url: 'https://topseofactors.com/factor.php?id=CPZZZ', type: 'Diversity', correlation: -0.19, maxValue: 281, page1Avg: 179, usagePercent: 97, searchesPercent: 88 },
  { rank: 23, name: 'Variations in Sentences', factorId: 'CP469', url: 'https://topseofactors.com/factor.php?id=CP469', type: 'Relevancy', correlation: -0.18, maxValue: 10610, page1Avg: 42, usagePercent: 71, searchesPercent: 89 },
  { rank: 24, name: 'Term Frequency', factorId: 'CP475', url: 'https://topseofactors.com/factor.php?id=CP475', type: 'Relevancy', correlation: -0.18, maxValue: 5, page1Avg: 3, usagePercent: 78, searchesPercent: 90, description: 'How often the target keyword appears', recommendation: 'Use keyword 3-5 times naturally' },
  { rank: 25, name: 'Variations in LI Tags', factorId: 'CP375', url: 'https://topseofactors.com/factor.php?id=CP375', type: 'Relevancy', correlation: -0.18, maxValue: 2891, page1Avg: 22, usagePercent: 65, searchesPercent: 87 },
  { rank: 26, name: 'Variations in A Tags', factorId: 'CP129', url: 'https://topseofactors.com/factor.php?id=CP129', type: 'Relevancy', correlation: -0.18, maxValue: 5483, page1Avg: 25, usagePercent: 65, searchesPercent: 84 },
  { rank: 27, name: 'Number of Referring Domains', factorId: 'OFFPAGE02', url: 'https://topseofactors.com/factor.php?id=OFFPAGE02', type: 'Authority', correlation: -0.18, maxValue: 2425, page1Avg: 110, usagePercent: 45, searchesPercent: 70, description: 'Unique domains linking to your page', recommendation: 'Build quality backlinks from diverse domains' },
  { rank: 28, name: 'Variations in Search Result Display URL', factorId: 'CP071', url: 'https://topseofactors.com/factor.php?id=CP071', type: 'Relevancy', correlation: -0.18, maxValue: 15, page1Avg: 2, usagePercent: 75, searchesPercent: 81 },
  { rank: 29, name: 'Variations in Search Result Link Text', factorId: 'CP097', url: 'https://topseofactors.com/factor.php?id=CP097', type: 'Relevancy', correlation: -0.18, maxValue: 15, page1Avg: 2, usagePercent: 75, searchesPercent: 81 },
  { rank: 30, name: 'Entities in H2 Tags', factorId: 'ENT003', url: 'https://topseofactors.com/factor.php?id=ENT003', type: '', correlation: -0.18, maxValue: 31, page1Avg: 7, usagePercent: 53, searchesPercent: 93 },
  { rank: 31, name: 'Variations in H1 Tags', factorId: 'CP152', url: 'https://topseofactors.com/factor.php?id=CP152', type: 'Relevancy', correlation: -0.18, maxValue: 12, page1Avg: 1, usagePercent: 53, searchesPercent: 87 },
  { rank: 32, name: 'Leading Variations in H1, H2, and H3 Tags', factorId: 'CP156', url: 'https://topseofactors.com/factor.php?id=CP156', type: 'Relevancy', correlation: -0.18, maxValue: 18, page1Avg: 2, usagePercent: 43, searchesPercent: 86 },
  { rank: 33, name: 'Variations in the Title Tag', factorId: 'CP481', url: 'https://topseofactors.com/factor.php?id=CP481', type: 'Relevancy', correlation: -0.18, maxValue: 16, page1Avg: 2, usagePercent: 64, searchesPercent: 86 },
  { rank: 34, name: 'Number of Backlinks', factorId: 'OFFPAGE01', url: 'https://topseofactors.com/factor.php?id=OFFPAGE01', type: 'Authority', correlation: -0.18, maxValue: 770312, page1Avg: 6973, usagePercent: 45, searchesPercent: 71, description: 'Total number of backlinks to your page', recommendation: 'Build quality backlinks consistently' },
  { rank: 35, name: 'LSI Words in Sentences', factorId: 'LSI002', url: 'https://topseofactors.com/factor.php?id=LSI002', type: 'Relevancy', correlation: -0.18, maxValue: 2713, page1Avg: 737, usagePercent: 69, searchesPercent: 94 },
  { rank: 36, name: 'Leading Variations in H1-H6 Tags', factorId: 'CP160', url: 'https://topseofactors.com/factor.php?id=CP160', type: 'Relevancy', correlation: -0.17, maxValue: 20, page1Avg: 2, usagePercent: 46, searchesPercent: 87 },
  { rank: 37, name: 'Variations in Search Result URL Path', factorId: 'CP999', url: 'https://topseofactors.com/factor.php?id=CP999', type: 'Relevancy', correlation: -0.17, maxValue: 9, page1Avg: 1, usagePercent: 46, searchesPercent: 84 },
  { rank: 38, name: 'Exact Matches in the HTML Tag', factorId: 'CP470a', url: 'https://topseofactors.com/factor.php?id=CP470a', type: 'Relevancy', correlation: -0.17, maxValue: 349, page1Avg: 14, usagePercent: 30, searchesPercent: 86 },
  { rank: 39, name: 'LSI Words in Title Tag', factorId: 'LSI001', url: 'https://topseofactors.com/factor.php?id=LSI001', type: 'Relevancy', correlation: -0.17, maxValue: 14, page1Avg: 6, usagePercent: 71, searchesPercent: 94, description: 'Semantically related words in title tag', recommendation: 'Include LSI keywords in your title' },
  { rank: 40, name: 'Number of Images', factorId: 'CP426', url: 'https://topseofactors.com/factor.php?id=CP426', type: 'Size', correlation: -0.17, maxValue: 166, page1Avg: 29, usagePercent: 78, searchesPercent: 86, description: 'Total images on the page', recommendation: 'Include relevant images with alt text' },
  { rank: 41, name: 'Number of Do Follow Backlinks', factorId: 'OFFPAGE03', url: 'https://topseofactors.com/factor.php?id=OFFPAGE03', type: 'Authority', correlation: -0.17, maxValue: 715834, page1Avg: 6347, usagePercent: 41, searchesPercent: 70 },
  { rank: 42, name: 'Number of HTML Tags', factorId: 'CPXX888', url: 'https://topseofactors.com/factor.php?id=CPXX888', type: 'Size', correlation: -0.17, maxValue: 3192, page1Avg: 1144, usagePercent: 85, searchesPercent: 86 },
  { rank: 43, name: 'Variations in Meta Description', factorId: 'CP381', url: 'https://topseofactors.com/factor.php?id=CP381', type: 'Relevancy', correlation: -0.17, maxValue: 43, page1Avg: 2, usagePercent: 52, searchesPercent: 84 },
  { rank: 44, name: 'Variation Count in Top 30KB', factorId: 'GD003', url: 'https://topseofactors.com/factor.php?id=GD003', type: 'Relevancy', correlation: -0.17, maxValue: 5957, page1Avg: 30, usagePercent: 67, searchesPercent: 86 },
  { rank: 45, name: 'Clean Keyword Density in the HTML Tag', factorId: 'CKWD001', url: 'https://topseofactors.com/factor.php?id=CKWD001', type: 'Relevancy', correlation: -0.17, maxValue: 150, page1Avg: 4, usagePercent: 70, searchesPercent: 80 },
  { rank: 46, name: 'Entities in Meta Description Tag', factorId: 'ENT008', url: 'https://topseofactors.com/factor.php?id=ENT008', type: 'Relevancy', correlation: -0.17, maxValue: 11, page1Avg: 3, usagePercent: 59, searchesPercent: 89 },
  { rank: 47, name: 'Variations in H2 Tags', factorId: 'CP165', url: 'https://topseofactors.com/factor.php?id=CP165', type: 'Relevancy', correlation: -0.17, maxValue: 68, page1Avg: 3, usagePercent: 44, searchesPercent: 84 },
  { rank: 48, name: 'Word Count', factorId: 'CP492', url: 'https://topseofactors.com/factor.php?id=CP492', type: 'Size', correlation: -0.17, maxValue: 4259, page1Avg: 1385, usagePercent: 85, searchesPercent: 85, description: 'Total word count on the page', recommendation: 'Aim for comprehensive content (1000+ words for competitive keywords)' },
  { rank: 49, name: 'Variations in the Canonical URL', factorId: 'CP137', url: 'https://topseofactors.com/factor.php?id=CP137', type: 'Relevancy', correlation: -0.17, maxValue: 48, page1Avg: 2, usagePercent: 49, searchesPercent: 85 },
  { rank: 50, name: 'Number of No Follow Backlinks', factorId: 'OFFPAGE04', url: 'https://topseofactors.com/factor.php?id=OFFPAGE04', type: 'Authority', correlation: -0.16, maxValue: 54478, page1Avg: 757, usagePercent: 34, searchesPercent: 66 },
]

/**
 * Get factors filtered by type
 */
export function getFactorsByType(type: SEOFactorType): SEOFactor[] {
  return TOP_200_FACTORS.filter(f => f.type === type)
}

/**
 * Get top N factors
 */
export function getTopFactors(count = 50): SEOFactor[] {
  return TOP_200_FACTORS.slice(0, count)
}

/**
 * Get factors grouped by type
 */
export function getFactorsGroupedByType(): Record<SEOFactorType | 'Untyped', SEOFactor[]> {
  const grouped: Record<string, SEOFactor[]> = {
    Diversity: [],
    Relevancy: [],
    Authority: [],
    Performance: [],
    Size: [],
    Technology: [],
    Trust: [],
    Other: [],
    Untyped: [],
  }

  for (const factor of TOP_200_FACTORS) {
    const type = factor.type || 'Untyped'
    if (type in grouped && grouped[type]) {
      grouped[type]!.push(factor)
    } else if (grouped['Untyped']) {
      grouped['Untyped'].push(factor)
    }
  }

  return grouped as Record<SEOFactorType | 'Untyped', SEOFactor[]>
}

/**
 * Get local SEO relevant factors
 */
export function getLocalSEOFactors(): SEOFactor[] {
  const localRelevantIds = [
    'ENT009', 'ENT001', 'ENT002', 'ENT003', 'ENT018', // Entity factors
    'CP481', 'LSI001', 'CP480', // Title factors
    'OFFPAGE02', 'OFFPAGE01', // Backlink factors
    'CP377', // Performance
  ]
  
  return TOP_200_FACTORS.filter(f => localRelevantIds.includes(f.factorId))
}

/**
 * Get dental practice specific recommendations
 */
export function getDentalPracticeSEOTips(): { factor: SEOFactor; tip: string }[] {
  return [
    {
      factor: TOP_200_FACTORS[5]!, // Entities in Title Tag
      tip: 'Include your dental practice name and city in your title tag (e.g., "Bright Smiles Dental | Arlington TX Dentist")'
    },
    {
      factor: TOP_200_FACTORS[0]!, // LSI Words
      tip: 'Use dental-related LSI keywords like "teeth cleaning", "dental checkup", "oral health", "dental implants"'
    },
    {
      factor: TOP_200_FACTORS[26]!, // Referring Domains
      tip: 'Get backlinks from local business directories, dental associations, and local news sites'
    },
    {
      factor: TOP_200_FACTORS[18]!, // Load Time
      tip: 'Optimize images and enable caching to keep load time under 1.5 seconds for better mobile experience'
    },
    {
      factor: TOP_200_FACTORS[47]!, // Word Count
      tip: 'Create comprehensive service pages with 800+ words covering procedures, benefits, and FAQs'
    },
  ]
}

