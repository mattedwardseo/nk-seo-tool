/**
 * DataForSEO Labs API Response Fixtures
 */

export const mockDomainRankOverview = {
  target: 'example-dental.com',
  location_code: 2840,
  language_code: 'en',
  total_count: 450,
  metrics: {
    organic: {
      pos_1: 5,
      pos_2_3: 12,
      pos_4_10: 45,
      pos_11_20: 85,
      pos_21_30: 92,
      pos_31_40: 78,
      pos_41_50: 65,
      pos_51_60: 38,
      pos_61_70: 20,
      pos_71_80: 8,
      pos_81_90: 2,
      pos_91_100: 0,
      etv: 12500,
      impressions_etv: 185000,
      count: 450,
      is_up: 28,
      is_down: 15,
      is_new: 12,
      is_lost: 5,
      estimated_paid_traffic_cost: 8500.5,
    },
    paid: {
      pos_1: 0,
      pos_2_3: 0,
      pos_4_10: 0,
      pos_11_20: 0,
      pos_21_30: 0,
      pos_31_40: 0,
      pos_41_50: 0,
      pos_51_60: 0,
      pos_61_70: 0,
      pos_71_80: 0,
      pos_81_90: 0,
      pos_91_100: 0,
      etv: 0,
      impressions_etv: 0,
      count: 0,
      is_up: 0,
      is_down: 0,
      is_new: 0,
      is_lost: 0,
      estimated_paid_traffic_cost: 0,
    },
  },
}

export const mockRankedKeywordItem = {
  keyword_data: {
    keyword: 'dentist austin tx',
    location_code: 2840,
    language_code: 'en',
    keyword_info: {
      search_volume: 4800,
      competition: 0.75,
      competition_level: 'HIGH',
      cpc: 12.5,
      low_top_of_page_bid: 8.5,
      high_top_of_page_bid: 18.0,
      monthly_searches: [],
    },
  },
  ranked_serp_element: {
    serp_item: {
      type: 'organic',
      rank_group: 5,
      rank_absolute: 6,
      position: 'left',
      domain: 'example-dental.com',
      title: 'Example Dental - Austin TX',
      url: 'https://example-dental.com/',
      is_featured_snippet: false,
      etv: 850,
      impressions_etv: 12500,
    },
  },
}

export const mockRankedKeywords = [
  mockRankedKeywordItem,
  {
    ...mockRankedKeywordItem,
    keyword_data: {
      ...mockRankedKeywordItem.keyword_data,
      keyword: 'emergency dentist austin',
      keyword_info: {
        ...mockRankedKeywordItem.keyword_data.keyword_info,
        search_volume: 3200,
        cpc: 22.5,
      },
    },
    ranked_serp_element: {
      ...mockRankedKeywordItem.ranked_serp_element,
      serp_item: {
        ...mockRankedKeywordItem.ranked_serp_element.serp_item,
        rank_group: 3,
        rank_absolute: 4,
      },
    },
  },
  {
    ...mockRankedKeywordItem,
    keyword_data: {
      ...mockRankedKeywordItem.keyword_data,
      keyword: 'teeth whitening austin',
      keyword_info: {
        ...mockRankedKeywordItem.keyword_data.keyword_info,
        search_volume: 2400,
        cpc: 8.5,
      },
    },
    ranked_serp_element: {
      ...mockRankedKeywordItem.ranked_serp_element,
      serp_item: {
        ...mockRankedKeywordItem.ranked_serp_element.serp_item,
        rank_group: 8,
        rank_absolute: 10,
      },
    },
  },
]

export const mockCompetitorDomainItem = {
  domain: 'competitor-dental.com',
  avg_position: 12.5,
  median_position: 10,
  rating: 450,
  etv: 8500,
  keywords_count: 320,
  relevant_serp_items: 85,
  intersections: 125,
  metrics: {
    organic: {
      count: 320,
      etv: 8500,
      impressions_etv: 125000,
      pos_1: 3,
      pos_2_3: 8,
      pos_4_10: 28,
    },
  },
}

export const mockCompetitors = [
  mockCompetitorDomainItem,
  {
    ...mockCompetitorDomainItem,
    domain: 'another-dental.com',
    avg_position: 15.2,
    rating: 380,
    keywords_count: 280,
  },
  {
    ...mockCompetitorDomainItem,
    domain: 'third-dental.com',
    avg_position: 18.5,
    rating: 320,
    keywords_count: 220,
  },
]

export const mockKeywordDifficultyResult = {
  keyword: 'dentist austin',
  keyword_difficulty: 68,
}

export const mockKeywordDifficultyResults = [
  mockKeywordDifficultyResult,
  { keyword: 'emergency dentist austin', keyword_difficulty: 72 },
  { keyword: 'teeth whitening austin', keyword_difficulty: 45 },
  { keyword: 'dental implants austin', keyword_difficulty: 58 },
]

export const mockSearchIntentItem = {
  keyword: 'dentist near me',
  keyword_intent: {
    main_intent: 'transactional' as const,
    foreign_intent: ['local', 'commercial'],
    last_updated_time: '2024-01-15T10:30:00Z',
  },
}

export const mockSearchIntentResults = [
  mockSearchIntentItem,
  {
    keyword: 'how to find a good dentist',
    keyword_intent: {
      main_intent: 'informational' as const,
      foreign_intent: ['commercial'],
      last_updated_time: '2024-01-15T10:30:00Z',
    },
  },
  {
    keyword: 'example dental reviews',
    keyword_intent: {
      main_intent: 'navigational' as const,
      foreign_intent: ['informational'],
      last_updated_time: '2024-01-15T10:30:00Z',
    },
  },
]

export const mockTrafficEstimationResult = {
  target: 'example-dental.com',
  location_code: 2840,
  language_code: 'en',
  organic: {
    etv: 12500,
    impressions_etv: 185000,
    count: 450,
    estimated_paid_traffic_cost: 8500.5,
  },
  paid: {
    etv: 0,
    impressions_etv: 0,
    count: 0,
    estimated_paid_traffic_cost: 0,
  },
}

export const mockKeywordSuggestion = {
  keyword: 'best dentist austin',
  location_code: 2840,
  language_code: 'en',
  keyword_info: {
    search_volume: 2200,
    competition: 0.72,
    competition_level: 'HIGH',
    cpc: 14.25,
    low_top_of_page_bid: 9.5,
    high_top_of_page_bid: 20.0,
    monthly_searches: [],
  },
}

export const mockKeywordSuggestions = [
  mockKeywordSuggestion,
  {
    ...mockKeywordSuggestion,
    keyword: 'affordable dentist austin',
    keyword_info: {
      ...mockKeywordSuggestion.keyword_info,
      search_volume: 1800,
      cpc: 11.5,
    },
  },
  {
    ...mockKeywordSuggestion,
    keyword: 'pediatric dentist austin',
    keyword_info: {
      ...mockKeywordSuggestion.keyword_info,
      search_volume: 1500,
      cpc: 9.75,
    },
  },
]
