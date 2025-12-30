/**
 * OnPage API Response Fixtures
 */

import type { OnPageInstantResult } from '../../../types'

export const mockOnPageInstantResult: OnPageInstantResult = {
  resource_type: 'html',
  status_code: 200,
  url: 'https://example-dental.com',
  meta: {
    title: 'Best Dental Practice in Austin | Example Dental',
    charset: 65001,
    follow: true,
    htags: {
      h1: ['Welcome to Example Dental'],
      h2: ['Our Services', 'Meet Our Team', 'Contact Us'],
      h3: ['General Dentistry', 'Cosmetic Dentistry', 'Emergency Care'],
    },
    external_links_count: 15,
    title_length: 45,
    cumulative_layout_shift: 0.05,
    content: {
      plain_text_size: 12500,
      plain_text_rate: 0.45,
      plain_text_word_count: 1850,
      automated_readability_index: 8.5,
      coleman_liau_readability_index: 9.2,
      dale_chall_readability_index: 7.8,
      flesch_kincaid_readability_index: 65,
      smog_readability_index: 8.9,
      title_to_content_consistency: 0.82,
    },
  },
  page_timing: {
    time_to_interactive: 2800,
    dom_complete: 2500,
    largest_contentful_paint: 2200,
    first_input_delay: 45,
    connection_time: 120,
    time_to_secure_connection: 85,
    duration_time: 3200,
    fetch_end: 850,
  },
  onpage_score: 78.5,
  total_dom_size: 285000,
  size: 125000,
  encoded_size: 42000,
  total_transfer_size: 1850000,
  fetch_time: '2024-11-20 14:30:00 +00:00',
  cache_control: {
    cachable: true,
    ttl: 3600,
  },
  checks: {
    canonical: true,
    is_https: true,
    is_http2: true,
    has_meta_title: true,
    has_meta_description: true,
    has_h1: true,
    low_content_rate: false,
    is_4xx_code: false,
    is_5xx_code: false,
    is_redirect: false,
    is_broken: false,
    has_render_blocking_resources: true,
    has_deprecated_html_tags: false,
    large_page_size: false,
    has_sitemap: true,
    has_robots_txt: true,
    is_orphan_page: false,
    has_structured_data: true,
    is_mobile_friendly: true,
    has_nofollow_links: false,
  },
  media_type: 'text/html',
  url_length: 28,
  relative_url_length: 1,
  last_modified: {
    header: '2024-11-15 10:00:00 +00:00',
  },
}

export const mockOnPageInstantResultPoor: OnPageInstantResult = {
  ...mockOnPageInstantResult,
  onpage_score: 45.2,
  page_timing: {
    time_to_interactive: 8500,
    dom_complete: 7200,
    largest_contentful_paint: 5800,
    first_input_delay: 280,
    connection_time: 450,
    time_to_secure_connection: 320,
    duration_time: 9500,
    fetch_end: 1200,
  },
  checks: {
    ...mockOnPageInstantResult.checks,
    is_https: false,
    is_http2: false,
    has_meta_description: false,
    large_page_size: true,
    has_render_blocking_resources: true,
    is_mobile_friendly: false,
    has_structured_data: false,
  },
}

export const mockLighthouseResult = {
  url: 'https://example-dental.com',
  datetime: '2024-11-20 14:30:00 +00:00',
  categories: {
    performance: {
      id: 'performance',
      title: 'Performance',
      description: 'Performance metrics',
      score: 0.85,
    },
    accessibility: {
      id: 'accessibility',
      title: 'Accessibility',
      description: 'Accessibility audit',
      score: 0.92,
    },
    best_practices: {
      id: 'best-practices',
      title: 'Best Practices',
      description: 'Best practices audit',
      score: 0.88,
    },
    seo: {
      id: 'seo',
      title: 'SEO',
      description: 'SEO audit',
      score: 0.95,
    },
  },
  audits: {
    'first-contentful-paint': {
      id: 'first-contentful-paint',
      title: 'First Contentful Paint',
      description: 'FCP measures when content appears',
      score: 0.9,
      display_value: '1.2 s',
      numeric_value: 1200,
    },
    'largest-contentful-paint': {
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      description: 'LCP measures largest content',
      score: 0.85,
      display_value: '2.2 s',
      numeric_value: 2200,
    },
    'cumulative-layout-shift': {
      id: 'cumulative-layout-shift',
      title: 'Cumulative Layout Shift',
      description: 'CLS measures visual stability',
      score: 0.95,
      display_value: '0.05',
      numeric_value: 0.05,
    },
    'total-blocking-time': {
      id: 'total-blocking-time',
      title: 'Total Blocking Time',
      description: 'TBT measures interactivity',
      score: 0.82,
      display_value: '180 ms',
      numeric_value: 180,
    },
    'speed-index': {
      id: 'speed-index',
      title: 'Speed Index',
      description: 'How quickly content is visually displayed',
      score: 0.88,
      display_value: '1.8 s',
      numeric_value: 1800,
    },
  },
}

export const mockLighthouseResultPoor = {
  ...mockLighthouseResult,
  categories: {
    performance: {
      ...mockLighthouseResult.categories.performance,
      score: 0.35,
    },
    accessibility: {
      ...mockLighthouseResult.categories.accessibility,
      score: 0.62,
    },
    best_practices: {
      ...mockLighthouseResult.categories.best_practices,
      score: 0.55,
    },
    seo: {
      ...mockLighthouseResult.categories.seo,
      score: 0.68,
    },
  },
}
