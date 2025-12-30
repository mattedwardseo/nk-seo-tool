/**
 * Local SEO Recommendations Knowledge Base
 * Based on industry best practices for dental/medical local SEO
 */

export interface RecommendationItem {
  id: string
  title: string
  why: string
  goodThreshold?: number | string
  warningThreshold?: number | string
  actions: {
    good: string
    warning: string
    critical: string
  }
}

export interface RecommendationSection {
  id: string
  title: string
  description: string
  items: RecommendationItem[]
}

export const LOCAL_SEO_RECOMMENDATIONS: RecommendationSection[] = [
  {
    id: 'technical',
    title: 'Technical SEO',
    description: 'Foundation elements that affect crawlability and indexation',
    items: [
      {
        id: 'page-speed',
        title: 'Page Speed (Core Web Vitals)',
        why: 'Google uses Core Web Vitals as a ranking factor. Slow sites lose 7% conversions per second of delay. Mobile users expect pages to load in under 3 seconds.',
        goodThreshold: 2.5,
        warningThreshold: 4.0,
        actions: {
          good: 'Page speed is optimized. Continue monitoring with PageSpeed Insights monthly.',
          warning:
            'Install a caching plugin (WP Rocket, W3 Total Cache), optimize images with WebP format, enable lazy loading for images below the fold.',
          critical:
            'Critical speed issues. Compress all images, enable CDN (Cloudflare), minimize JavaScript, defer non-critical CSS, and consider upgrading hosting.',
        },
      },
      {
        id: 'broken-links',
        title: 'Broken Links (404 Errors)',
        why: 'Broken links hurt user experience and waste crawl budget. They signal poor site maintenance to Google and can cause visitors to leave.',
        goodThreshold: 0,
        warningThreshold: 5,
        actions: {
          good: 'No broken links found. Great job maintaining link health!',
          warning:
            'Fix broken links by updating href values or creating 301 redirects to relevant pages. Prioritize links on high-traffic pages.',
          critical:
            'Many broken links detected. Run a full site crawl, export broken links, and create a redirect map. Fix internal links first, then external.',
        },
      },
      {
        id: 'redirects',
        title: 'Redirect Chains',
        why: 'Redirect chains (A→B→C) slow page loads by 100-500ms per hop and dilute PageRank. Google follows up to 10 redirects but recommends direct paths.',
        goodThreshold: 0,
        warningThreshold: 3,
        actions: {
          good: 'No redirect chains found. All redirects point directly to final destinations.',
          warning:
            'Update redirect chains to point directly to final URLs. Check .htaccess or redirect plugin for outdated rules.',
          critical:
            'Multiple redirect chains detected. Audit all internal links, update them to final URLs, and consolidate redirect rules.',
        },
      },
      {
        id: 'schema-markup',
        title: 'Schema Markup (Structured Data)',
        why: 'Schema markup helps search engines understand your business. LocalBusiness schema enables rich results showing hours, ratings, and contact info directly in search.',
        goodThreshold: 'LocalBusiness',
        actions: {
          good: 'LocalBusiness schema detected with complete information. Consider adding FAQPage schema for service pages.',
          warning:
            'Add LocalBusiness schema with: name, address, phone, hours, geo coordinates, priceRange, and service area.',
          critical:
            'No schema markup found. Implement LocalBusiness schema immediately - this is essential for local pack visibility.',
        },
      },
      {
        id: 'sitemap',
        title: 'XML Sitemap',
        why: 'Sitemaps help search engines discover all your pages. They should include only indexable pages and be submitted to Google Search Console.',
        actions: {
          good: 'Sitemap found and properly formatted. Ensure it is submitted in Search Console.',
          warning: 'Sitemap exists but may include non-indexable URLs. Clean up to include only canonical, indexable pages.',
          critical:
            'No sitemap found. Generate an XML sitemap using Yoast SEO or RankMath and submit to Google Search Console.',
        },
      },
      {
        id: 'https',
        title: 'HTTPS Security',
        why: 'HTTPS is a confirmed Google ranking signal. Sites without HTTPS show "Not Secure" warnings that destroy trust and conversions.',
        actions: {
          good: 'All pages served over HTTPS with valid SSL certificate.',
          warning: 'Mixed content detected. Some resources loading over HTTP. Update all asset URLs to HTTPS.',
          critical: 'Site not using HTTPS. Install SSL certificate immediately - this is critical for rankings and trust.',
        },
      },
      {
        id: 'mobile-friendly',
        title: 'Mobile Friendliness',
        why: 'Google uses mobile-first indexing. Over 60% of local searches happen on mobile. Non-mobile-friendly sites lose rankings and visitors.',
        actions: {
          good: 'Site is mobile-friendly with responsive design.',
          warning:
            'Some mobile usability issues detected. Check tap targets, font sizes, and viewport configuration.',
          critical:
            'Site is not mobile-friendly. Implement responsive design or mobile theme immediately.',
        },
      },
    ],
  },
  {
    id: 'onsite',
    title: 'On-Site Optimization',
    description: 'Content and structure elements that signal relevance',
    items: [
      {
        id: 'title-tags',
        title: 'Page Titles',
        why: 'Title tags are the #1 on-page ranking factor. For local SEO, format should be: "[Service] in [City], [State] | [Brand Name]" to capture local intent.',
        actions: {
          good: 'Titles are optimized with service keywords and location. Good length (50-60 characters).',
          warning:
            'Add city/state to title tags. Use format: "Dentist in Calgary, AB | Inglewood Family Dental"',
          critical:
            'Missing or duplicate titles found. Each page needs a unique, keyword-rich title under 60 characters.',
        },
      },
      {
        id: 'meta-descriptions',
        title: 'Meta Descriptions',
        why: 'Meta descriptions impact click-through rate from search results. Include a call-to-action, phone number, and unique value proposition.',
        goodThreshold: 150,
        warningThreshold: 100,
        actions: {
          good: 'Meta descriptions are optimized with CTAs and appropriate length (150-160 chars).',
          warning:
            'Improve meta descriptions. Include: service, location, CTA ("Call today"), and unique benefit.',
          critical:
            'Missing meta descriptions. Write unique descriptions for each page with CTAs like "Book your appointment today!"',
        },
      },
      {
        id: 'h1-tags',
        title: 'H1 Heading Tags',
        why: 'H1 tags tell Google and users what a page is about. Each page should have exactly one H1 containing the primary keyword and location.',
        actions: {
          good: 'All pages have single, keyword-optimized H1 tags.',
          warning:
            'Some pages have multiple H1s or generic H1s. Ensure one H1 per page with format: "[Service] in [City]"',
          critical: 'Pages missing H1 tags. Add a single, descriptive H1 to each page immediately.',
        },
      },
      {
        id: 'url-structure',
        title: 'URL Structure',
        why: 'Clean, descriptive URLs improve click-through rates and help search engines understand page content. Include keywords, avoid parameters.',
        actions: {
          good: 'URLs are clean, descriptive, and keyword-rich (e.g., /dental-implants-calgary/).',
          warning:
            'URLs could be improved. Use hyphens, include keywords, keep under 75 characters.',
          critical:
            'Poor URL structure with parameters or meaningless strings. Restructure URLs and implement 301 redirects.',
        },
      },
      {
        id: 'content-optimization',
        title: 'Content Quality & Depth',
        why: 'Google rewards comprehensive, helpful content. Service pages should be 1000+ words covering: what, why, process, benefits, FAQs, and local relevance.',
        goodThreshold: 1000,
        warningThreshold: 500,
        actions: {
          good: 'Content is comprehensive with good word count and local mentions.',
          warning:
            'Expand thin content. Add sections: service details, benefits, process steps, FAQs, and neighborhood mentions.',
          critical:
            'Very thin content detected. Rewrite pages with 1000+ words, include local keywords, add unique value.',
        },
      },
      {
        id: 'internal-linking',
        title: 'Internal Linking Structure',
        why: 'Internal links distribute PageRank and help users discover related services. Link service pages to related treatments and the homepage.',
        actions: {
          good: 'Strong internal linking with relevant anchor text.',
          warning:
            'Add more internal links. Link from blog posts to service pages, cross-link related services.',
          critical:
            'Poor internal linking. Create a linking strategy: homepage → category pages → service pages.',
        },
      },
      {
        id: 'google-map-embed',
        title: 'Google Map Embed',
        why: 'Embedding your Google Map strengthens local signals and helps users find you. Should appear sitewide in footer or on contact page.',
        actions: {
          good: 'Google Map properly embedded with correct business location.',
          warning: 'Map embed found but may not be on all pages. Add to footer for sitewide visibility.',
          critical:
            'No Google Map embed found. Add an iframe map embed to the contact page and footer.',
        },
      },
      {
        id: 'nap-consistency',
        title: 'NAP Consistency (Name, Address, Phone)',
        why: 'Consistent NAP across your website builds trust with Google. Ensure exact match with your Google Business Profile.',
        actions: {
          good: 'NAP is consistent across the website and matches GBP.',
          warning:
            'Minor NAP inconsistencies found. Standardize format: "123 Main St, Suite 100" not "123 Main Street #100"',
          critical:
            'NAP inconsistencies detected. Audit all pages and standardize to match your Google Business Profile exactly.',
        },
      },
    ],
  },
  {
    id: 'gbp',
    title: 'Google Business Profile',
    description: 'Optimization factors for local pack visibility',
    items: [
      {
        id: 'gbp-description',
        title: 'Business Description',
        why: 'The business description (750 chars max) helps Google understand your services and appears in your profile. Include services, areas served, and differentiators.',
        goodThreshold: 700,
        warningThreshold: 400,
        actions: {
          good: 'Business description is complete and keyword-optimized.',
          warning:
            'Expand your description. Include: all services, years in business, areas served, insurance accepted.',
          critical:
            'Missing or very short description. Write a 750-character description highlighting your services and location.',
        },
      },
      {
        id: 'gbp-qanda',
        title: 'Q&As',
        why: 'GBP Q&As appear in search results and voice search. They capture long-tail queries like "Do you accept insurance?" Add your own Q&As proactively.',
        goodThreshold: 20,
        warningThreshold: 5,
        actions: {
          good: 'Good Q&A coverage with 20+ relevant questions and answers.',
          warning:
            'Add more Q&As. Focus on: services offered, pricing, insurance, hours, parking, accessibility.',
          critical:
            'No Q&As found. Add 20+ FAQs covering common patient questions. Ask from personal account, answer as business.',
        },
      },
      {
        id: 'gbp-services',
        title: 'Services Listed',
        why: 'Services in GBP help you appear for specific searches like "teeth whitening near me." List all services with descriptions and links to website pages.',
        goodThreshold: 15,
        warningThreshold: 5,
        actions: {
          good: 'Comprehensive services list with descriptions.',
          warning:
            'Add more services. Include every treatment you offer, with descriptions and website URLs.',
          critical:
            'Few or no services listed. Add all services immediately - this directly impacts service-specific searches.',
        },
      },
      {
        id: 'gbp-products',
        title: 'Products',
        why: 'Products in GBP increase visual engagement and can showcase treatments, packages, or equipment. Include images and pricing when possible.',
        goodThreshold: 5,
        warningThreshold: 1,
        actions: {
          good: 'Products showcase is complete with images and descriptions.',
          warning:
            'Add more products. For dental: Invisalign, whitening kits, mouthguards, etc.',
          critical:
            'No products listed. Add at least 5 products with professional images and descriptions.',
        },
      },
      {
        id: 'gbp-posts',
        title: 'Google Posts',
        why: 'Regular posts show Google your business is active. Posts appear in your profile and can highlight offers, events, or new services. Post weekly for best results.',
        goodThreshold: 7,
        warningThreshold: 30,
        actions: {
          good: 'Active posting schedule with recent posts.',
          warning:
            'Post more frequently. Aim for weekly posts about: offers, tips, team highlights, new services.',
          critical:
            'No recent posts (30+ days). Start posting weekly with CTAs and images to boost engagement.',
        },
      },
      {
        id: 'gbp-reviews',
        title: 'Reviews & Ratings',
        why: 'Reviews are the #1 local ranking factor. 4.5+ star rating with 50+ reviews builds trust. Respond to all reviews within 24 hours.',
        goodThreshold: 50,
        warningThreshold: 20,
        actions: {
          good: 'Strong review profile with excellent rating and consistent responses.',
          warning:
            'Build more reviews. Send follow-up emails with review link, respond to all existing reviews.',
          critical:
            'Too few reviews or poor rating. Implement review generation campaign and address negative feedback.',
        },
      },
      {
        id: 'gbp-photos',
        title: 'Photos',
        why: 'Businesses with photos get 42% more direction requests and 35% more website clicks. Include: exterior, interior, team, equipment, and treatment rooms.',
        goodThreshold: 20,
        warningThreshold: 5,
        actions: {
          good: 'Comprehensive photo gallery covering all aspects of the business.',
          warning:
            'Add more photos. Include: exterior (2+), interior (5+), team (3+), services in action.',
          critical:
            'Very few photos. Upload 20+ professional photos immediately - this significantly impacts clicks.',
        },
      },
      {
        id: 'gbp-categories',
        title: 'Categories',
        why: 'Categories tell Google what searches to show your business for. Choose one primary category and up to 9 secondary categories that match your services.',
        goodThreshold: 5,
        warningThreshold: 2,
        actions: {
          good: 'Primary and secondary categories are well-selected and relevant.',
          warning:
            'Add more secondary categories. For dentists: Cosmetic Dentist, Emergency Dental Service, Pediatric Dentist, etc.',
          critical:
            'Missing or wrong categories. Set primary category (e.g., "Dentist") and add all relevant secondary categories.',
        },
      },
      {
        id: 'gbp-attributes',
        title: 'Business Attributes',
        why: 'Attributes highlight amenities like wheelchair access, free WiFi, or appointment-only. They help match searchers with specific needs.',
        actions: {
          good: 'All relevant attributes are set.',
          warning:
            'Review and add more attributes: accessibility, amenities, payment methods, languages spoken.',
          critical:
            'No attributes set. Add all applicable attributes to improve visibility for specific searches.',
        },
      },
    ],
  },
]

/**
 * Get recommendation by section and item ID
 */
export function getRecommendation(sectionId: string, itemId: string): RecommendationItem | undefined {
  const section = LOCAL_SEO_RECOMMENDATIONS.find((s) => s.id === sectionId)
  return section?.items.find((i) => i.id === itemId)
}

/**
 * Get all items in a section
 */
export function getSectionItems(sectionId: string): RecommendationItem[] {
  const section = LOCAL_SEO_RECOMMENDATIONS.find((s) => s.id === sectionId)
  return section?.items || []
}
