/**
 * Business API Response Fixtures
 */

export const mockBusinessInfoResult = {
  type: 'google_my_business_info',
  keyword: 'example dental austin',
  location_code: 2840,
  language_code: 'en',
  title: 'Example Dental Practice',
  description:
    'Full-service dental practice offering general dentistry, cosmetic procedures, and emergency services. Serving Austin and surrounding areas for over 15 years.',
  category: 'Dentist',
  category_ids: ['dentist'],
  additional_categories: [
    'Cosmetic dentist',
    'Emergency dental service',
    'Teeth whitening service',
  ],
  cid: '12345678901234567',
  feature_id: 'business_feature_123',
  address: '123 Main St, Austin, TX 78701',
  address_info: {
    borough: null,
    address: '123 Main St',
    city: 'Austin',
    zip: '78701',
    region: 'Texas',
    country_code: 'US',
  },
  place_id: 'ChIJ_example123',
  phone: '+1 512-555-1234',
  url: 'https://example-dental.com/',
  domain: 'example-dental.com',
  logo: 'https://example-dental.com/logo.png',
  main_image: 'https://example-dental.com/office.jpg',
  total_photos: 45,
  snippet: 'Award-winning dental care serving Austin for 15+ years.',
  latitude: 30.2672,
  longitude: -97.7431,
  is_claimed: true,
  is_directory_item: false,
  rating: {
    rating_type: 'Max5',
    value: 4.8,
    votes_count: 245,
    rating_max: 5,
  },
  work_time: {
    work_hours: {
      monday: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      tuesday: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      wednesday: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      thursday: { open: { hour: 8, minute: 0 }, close: { hour: 17, minute: 0 } },
      friday: { open: { hour: 8, minute: 0 }, close: { hour: 16, minute: 0 } },
      saturday: { open: { hour: 9, minute: 0 }, close: { hour: 13, minute: 0 } },
      sunday: null,
    },
    current_status: 'open',
  },
  popular_times: {
    monday: [
      { time: { hour: 9, minute: 0 }, popularity: 25 },
      { time: { hour: 10, minute: 0 }, popularity: 45 },
      { time: { hour: 11, minute: 0 }, popularity: 65 },
      { time: { hour: 12, minute: 0 }, popularity: 55 },
      { time: { hour: 14, minute: 0 }, popularity: 70 },
      { time: { hour: 15, minute: 0 }, popularity: 60 },
      { time: { hour: 16, minute: 0 }, popularity: 40 },
    ],
  },
  people_also_search: [
    { cid: '234567890', title: 'Austin Family Dental' },
    { cid: '345678901', title: 'Downtown Dental Austin' },
  ],
  attributes: {
    available_attributes: {
      service_options: ['Online appointments', 'In-person appointments'],
      accessibility: ['Wheelchair accessible entrance', 'Wheelchair accessible restroom'],
      offerings: ['Teeth cleaning', 'Teeth whitening', 'Dental implants'],
      payments: ['Accepts credit cards', 'Accepts insurance'],
    },
    unavailable_attributes: {
      service_options: ['Drive-through'],
    },
  },
}

export const mockBusinessInfoResultIncomplete = {
  ...mockBusinessInfoResult,
  title: 'Incomplete Dental',
  description: null,
  logo: null,
  main_image: null,
  total_photos: 0,
  is_claimed: false,
  phone: null,
  work_time: null,
  attributes: null,
  rating: {
    rating_type: 'Max5',
    value: 3.2,
    votes_count: 12,
    rating_max: 5,
  },
}

export const mockReviewItem = {
  type: 'google_review',
  rank_absolute: 1,
  rating: {
    rating_type: 'Max5',
    value: 5,
    rating_max: 5,
  },
  profile_name: 'John D.',
  profile_url: 'https://google.com/maps/contrib/123',
  profile_image_url: 'https://lh3.googleusercontent.com/a/user123',
  review_text:
    'Dr. Smith and the team at Example Dental are amazing! They made my root canal completely painless and the office is beautiful. Highly recommend!',
  time_ago: '2 weeks ago',
  timestamp: '2024-11-06 14:30:00 +00:00',
  response: {
    text: 'Thank you so much for your kind words, John! We are thrilled to hear about your positive experience.',
    time_ago: '1 week ago',
    timestamp: '2024-11-13 10:00:00 +00:00',
  },
}

export const mockReviews = [
  mockReviewItem,
  {
    ...mockReviewItem,
    rank_absolute: 2,
    rating: { rating_type: 'Max5', value: 4, rating_max: 5 },
    profile_name: 'Sarah M.',
    review_text:
      'Good experience overall. Staff was friendly but had to wait a bit longer than expected.',
    time_ago: '1 month ago',
    response: null,
  },
  {
    ...mockReviewItem,
    rank_absolute: 3,
    rating: { rating_type: 'Max5', value: 5, rating_max: 5 },
    profile_name: 'Mike T.',
    review_text:
      'Best dental office in Austin! Clean, modern, and the staff truly cares about patients.',
    time_ago: '3 weeks ago',
    response: {
      text: 'Thank you Mike! We appreciate your support.',
      time_ago: '2 weeks ago',
      timestamp: '2024-11-10 09:00:00 +00:00',
    },
  },
  {
    ...mockReviewItem,
    rank_absolute: 4,
    rating: { rating_type: 'Max5', value: 2, rating_max: 5 },
    profile_name: 'Lisa K.',
    review_text: 'Disappointing experience. Long wait times and billing issues.',
    time_ago: '2 months ago',
    response: null,
  },
  {
    ...mockReviewItem,
    rank_absolute: 5,
    rating: { rating_type: 'Max5', value: 5, rating_max: 5 },
    profile_name: 'David R.',
    review_text: 'Excellent care! Dr. Smith explained everything clearly.',
    time_ago: '1 month ago',
    response: {
      text: 'Thank you David!',
      time_ago: '3 weeks ago',
      timestamp: '2024-11-01 11:00:00 +00:00',
    },
  },
]

export const mockBusinessListingItem = {
  type: 'business_listing',
  title: 'Example Dental Practice',
  description: 'Full-service dental practice in Austin',
  category: 'Dentist',
  address: '123 Main St, Austin, TX 78701',
  address_info: {
    address: '123 Main St',
    city: 'Austin',
    zip: '78701',
    region: 'Texas',
    country_code: 'US',
  },
  place_id: 'ChIJ_example123',
  phone: '+1 512-555-1234',
  url: 'https://example-dental.com/',
  domain: 'example-dental.com',
  latitude: 30.2672,
  longitude: -97.7431,
  is_claimed: true,
  rating: {
    rating_type: 'Max5',
    value: 4.8,
    votes_count: 245,
    rating_max: 5,
  },
  contact_info: [
    { type: 'website', value: 'https://example-dental.com/' },
    { type: 'phone', value: '+1 512-555-1234' },
  ],
}

export const mockBusinessListings = [
  mockBusinessListingItem,
  {
    ...mockBusinessListingItem,
    title: 'Austin Family Dental',
    place_id: 'ChIJ_family123',
    rating: { rating_type: 'Max5', value: 4.5, votes_count: 180, rating_max: 5 },
  },
  {
    ...mockBusinessListingItem,
    title: 'Downtown Dental Austin',
    place_id: 'ChIJ_downtown123',
    rating: { rating_type: 'Max5', value: 4.6, votes_count: 220, rating_max: 5 },
  },
  {
    ...mockBusinessListingItem,
    title: 'Premier Dental Care',
    place_id: 'ChIJ_premier123',
    rating: { rating_type: 'Max5', value: 4.3, votes_count: 95, rating_max: 5 },
  },
]
