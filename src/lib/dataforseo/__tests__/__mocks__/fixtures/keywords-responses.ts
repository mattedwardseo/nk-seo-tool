/**
 * Keywords API Response Fixtures
 */

export const mockKeywordInfo = {
  keyword: 'dentist near me',
  location_code: 2840,
  language_code: 'en',
  search_volume: 165000,
  competition: 0.85,
  competition_level: 'HIGH',
  cpc: 12.45,
  low_top_of_page_bid: 8.5,
  high_top_of_page_bid: 18.75,
  monthly_searches: [
    { year: 2024, month: 11, search_volume: 168000 },
    { year: 2024, month: 10, search_volume: 162000 },
    { year: 2024, month: 9, search_volume: 158000 },
    { year: 2024, month: 8, search_volume: 155000 },
    { year: 2024, month: 7, search_volume: 152000 },
    { year: 2024, month: 6, search_volume: 160000 },
    { year: 2024, month: 5, search_volume: 158000 },
    { year: 2024, month: 4, search_volume: 156000 },
    { year: 2024, month: 3, search_volume: 162000 },
    { year: 2024, month: 2, search_volume: 165000 },
    { year: 2024, month: 1, search_volume: 170000 },
    { year: 2023, month: 12, search_volume: 175000 },
  ],
  keyword_annotations: {
    concepts: [
      { name: 'dentist', concept_group: 'Health' },
      { name: 'local search', concept_group: 'Intent' },
    ],
  },
}

export const mockKeywordInfoLowVolume = {
  ...mockKeywordInfo,
  keyword: 'pediatric dentist austin tx emergency',
  search_volume: 90,
  competition: 0.25,
  competition_level: 'LOW',
  cpc: 4.25,
  low_top_of_page_bid: 2.5,
  high_top_of_page_bid: 6.75,
}

export const mockKeywordForSiteResult = {
  keyword: 'teeth whitening austin',
  location_code: 2840,
  language_code: 'en',
  search_volume: 2400,
  competition: 0.65,
  competition_level: 'MEDIUM',
  cpc: 8.5,
  keyword_info: {
    last_updated_time: '2024-11-20',
    search_volume: 2400,
    competition: 0.65,
    cpc: 8.5,
    monthly_searches: [],
  },
  impressions_info: {
    bid: 8.5,
    match_type: 'exact',
    ad_position_min: 1.2,
    ad_position_max: 3.5,
    ad_position_average: 2.1,
    cpc_min: 5.5,
    cpc_max: 12.0,
    daily_impressions_min: 120,
    daily_impressions_max: 280,
    daily_clicks_min: 25,
    daily_clicks_max: 65,
  },
  serp_info: {
    se_type: 'google',
    check_url: 'https://google.com/search?q=teeth+whitening+austin',
    serp_item_types: ['organic', 'local_pack', 'people_also_ask'],
    se_results_count: 12500000,
    last_updated_time: '2024-11-20',
  },
}

export const mockKeywordsForSiteResults = [
  mockKeywordForSiteResult,
  {
    ...mockKeywordForSiteResult,
    keyword: 'dental implants austin',
    search_volume: 1800,
    cpc: 15.25,
  },
  {
    ...mockKeywordForSiteResult,
    keyword: 'emergency dentist austin',
    search_volume: 3200,
    cpc: 22.5,
  },
  {
    ...mockKeywordForSiteResult,
    keyword: 'cosmetic dentist austin tx',
    search_volume: 1200,
    cpc: 18.75,
  },
]

export const mockKeywordsTrendsResult = {
  keyword: 'dentist near me',
  location_code: 2840,
  language_code: 'en',
  type: 'google_trends_graph',
  data: [
    { date: '2024-11-01', value: 85 },
    { date: '2024-10-01', value: 82 },
    { date: '2024-09-01', value: 78 },
    { date: '2024-08-01', value: 75 },
    { date: 2024 - 7 - 1, value: 72 },
    { date: '2024-06-01', value: 80 },
    { date: '2024-05-01', value: 78 },
    { date: '2024-04-01', value: 76 },
    { date: '2024-03-01', value: 82 },
    { date: '2024-02-01', value: 85 },
    { date: '2024-01-01', value: 88 },
    { date: '2023-12-01', value: 92 },
  ],
  average_value: 81.1,
  min_value: 72,
  max_value: 92,
}

export const mockDentalKeywords = [
  { keyword: 'dentist austin tx', search_volume: 4800, cpc: 12.5, competition: 0.75 },
  { keyword: 'emergency dentist austin', search_volume: 3200, cpc: 22.5, competition: 0.85 },
  { keyword: 'teeth cleaning austin', search_volume: 1600, cpc: 6.25, competition: 0.55 },
  { keyword: 'dental implants austin', search_volume: 1800, cpc: 15.25, competition: 0.7 },
  { keyword: 'cosmetic dentist austin', search_volume: 1200, cpc: 18.75, competition: 0.65 },
]
