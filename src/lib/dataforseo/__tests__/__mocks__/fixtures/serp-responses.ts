/**
 * SERP API Response Fixtures
 */

export const mockOrganicResult = {
  type: 'organic',
  rank_group: 1,
  rank_absolute: 1,
  position: 'left',
  domain: 'example-dental.com',
  title: 'Best Dentist in Austin TX | Example Dental Practice',
  description:
    'Award-winning dental care in Austin. General dentistry, cosmetic dentistry, and emergency services. Call today for your appointment.',
  url: 'https://example-dental.com/',
  breadcrumb: 'https://example-dental.com',
  is_featured_snippet: false,
  pre_snippet: null,
  extended_snippet: null,
  amp_version: false,
  rating: null,
  highlighted: ['dentist', 'Austin'],
  links: null,
  main_domain: 'example-dental.com',
  relative_url: '/',
  is_malicious: false,
  is_web_story: false,
  website_name: 'Example Dental',
  etv: 12500,
  impressions_etv: 18000,
  estimated_paid_traffic_cost: 850.5,
}

export const mockOrganicResults = [
  mockOrganicResult,
  {
    ...mockOrganicResult,
    rank_group: 2,
    rank_absolute: 2,
    domain: 'competitor1.com',
    title: 'Austin Family Dental - Quality Dental Care',
    url: 'https://competitor1.com/',
  },
  {
    ...mockOrganicResult,
    rank_group: 3,
    rank_absolute: 3,
    domain: 'competitor2.com',
    title: 'Affordable Dentist Austin | Competitor Dental',
    url: 'https://competitor2.com/',
  },
  {
    ...mockOrganicResult,
    rank_group: 4,
    rank_absolute: 4,
    domain: 'competitor3.com',
    title: 'Top Rated Dentist in Austin Texas',
    url: 'https://competitor3.com/',
  },
  {
    ...mockOrganicResult,
    rank_group: 5,
    rank_absolute: 5,
    domain: 'competitor4.com',
    title: 'Emergency Dental Services Austin TX',
    url: 'https://competitor4.com/',
  },
]

export const mockLocalPackResult = {
  type: 'local_pack',
  rank_group: 1,
  rank_absolute: 1,
  position: 'left',
  domain: 'example-dental.com',
  title: 'Example Dental Practice',
  url: 'https://example-dental.com/',
  rating: {
    rating_type: 'Max5',
    value: 4.8,
    votes_count: 245,
    rating_max: 5,
  },
  is_paid: false,
  description: 'Dental clinic in Austin, TX',
  phone: '+1 512-555-1234',
  address: '123 Main St, Austin, TX 78701',
  cid: '12345678901234567',
  data_attrid: 'organic:local_pack',
  latitude: 30.2672,
  longitude: -97.7431,
  reviews_count: 245,
  place_id: 'ChIJ_example123',
  feature_id: 'local_pack_feature',
  main_domain: 'example-dental.com',
}

export const mockMapsResult = {
  type: 'maps_search',
  rank_group: 1,
  rank_absolute: 1,
  domain: 'example-dental.com',
  title: 'Example Dental Practice',
  url: 'https://example-dental.com/',
  rating: {
    rating_type: 'Max5',
    value: 4.8,
    votes_count: 245,
    rating_max: 5,
  },
  address: '123 Main St, Austin, TX 78701',
  phone: '+1 512-555-1234',
  work_hours: {
    work_hours: {
      mon: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      tue: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      wed: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      thu: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      fri: { open: { hour: 8, minute: 0 }, close: { hour: 16, minute: 0 } },
    },
    current_status: 'open',
  },
  latitude: 30.2672,
  longitude: -97.7431,
  category: 'Dentist',
  category_ids: ['dentist'],
  additional_categories: ['Cosmetic dentist', 'Emergency dental service'],
  is_claimed: true,
  place_id: 'ChIJ_example123',
  cid: '12345678901234567',
  feature_id: 'maps_feature',
  main_domain: 'example-dental.com',
}

export const mockLocationResult = {
  location_code: 2840,
  location_name: 'United States',
  location_code_parent: null,
  country_iso_code: 'US',
  location_type: 'Country',
}

export const mockLocations = [
  mockLocationResult,
  {
    location_code: 21176,
    location_name: 'Austin,Texas,United States',
    location_code_parent: 21157,
    country_iso_code: 'US',
    location_type: 'City',
  },
  {
    location_code: 21157,
    location_name: 'Texas,United States',
    location_code_parent: 2840,
    country_iso_code: 'US',
    location_type: 'State',
  },
]

export const mockSerpResponseWithFeatures = {
  type: 'organic',
  items: [
    ...mockOrganicResults,
    {
      type: 'featured_snippet',
      rank_group: 0,
      rank_absolute: 0,
      position: 'left',
      domain: 'healthline.com',
      title: 'How to Choose a Dentist',
      description: 'Steps to find the right dental provider...',
    },
    mockLocalPackResult,
  ],
}
