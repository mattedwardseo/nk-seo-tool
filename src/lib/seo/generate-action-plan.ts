import { LOCAL_SEO_RECOMMENDATIONS } from '@/lib/constants/local-seo-recommendations'

export interface ActionItem {
  id: string
  section: 'technical' | 'onsite' | 'gbp'
  sectionTitle: string
  title: string
  status: 'good' | 'warning' | 'critical'
  why: string
  action: string
  details: string[]
  priority: number
  value?: number | string
}

interface AuditStepResults {
  onPage?: any
  serp?: any
  backlinks?: any
  business?: any
  competitors?: any
}

/**
 * Generate actionable SEO recommendations from audit data
 */
export function generateActionPlan(auditData: AuditStepResults): ActionItem[] {
  const items: ActionItem[] = []

  // TECHNICAL SEO CHECKS
  if (auditData.onPage) {
    const onPage = auditData.onPage

    // Page Speed
    const lcp = onPage.page_timing?.lcp || onPage.pagespeed?.lcp || 0
    const fcp = onPage.page_timing?.fcp || onPage.pagespeed?.fcp || 0
    const recommendation = LOCAL_SEO_RECOMMENDATIONS[0]?.items[0] // page-speed
    if (!recommendation) return items

    items.push({
      id: 'page-speed',
      section: 'technical',
      sectionTitle: 'Technical SEO',
      title: recommendation.title,
      status: lcp === 0 ? 'warning' : lcp < 2.5 ? 'good' : lcp < 4 ? 'warning' : 'critical',
      why: recommendation.why,
      action:
        lcp === 0
          ? 'Unable to measure page speed. Ensure the site is accessible.'
          : lcp < 2.5
            ? recommendation.actions.good
            : lcp < 4
              ? recommendation.actions.warning
              : recommendation.actions.critical,
      details: lcp === 0 ? ['Page speed data not available'] : [`LCP: ${lcp.toFixed(2)}s`, `FCP: ${fcp.toFixed(2)}s`],
      priority: lcp > 4 ? 1 : lcp > 2.5 ? 3 : 10,
      value: lcp,
    })

    // Broken Links
    const brokenLinks = onPage.broken_links || []
    const brokenCount = Array.isArray(brokenLinks) ? brokenLinks.length : 0
    const brokenRec = LOCAL_SEO_RECOMMENDATIONS[0]?.items[1] // broken-links
    if (!brokenRec) return items

    items.push({
      id: 'broken-links',
      section: 'technical',
      sectionTitle: 'Technical SEO',
      title: brokenRec.title,
      status: brokenCount === 0 ? 'good' : brokenCount < 5 ? 'warning' : 'critical',
      why: brokenRec.why,
      action:
        brokenCount === 0
          ? brokenRec.actions.good
          : brokenCount < 5
            ? brokenRec.actions.warning
            : brokenRec.actions.critical,
      details:
        brokenCount === 0
          ? ['No broken links detected']
          : [`${brokenCount} broken links found`, ...(brokenLinks.slice(0, 3).map((link: any) => `• ${link.url || link}`) || [])],
      priority: brokenCount > 10 ? 2 : brokenCount > 0 ? 5 : 10,
      value: brokenCount,
    })

    // Schema Markup
    const hasSchema = onPage.checks?.has_localbusiness_schema || onPage.schema?.LocalBusiness || false
    const schemaRec = LOCAL_SEO_RECOMMENDATIONS[0]?.items[3] // schema-markup
    if (!schemaRec) return items

    items.push({
      id: 'schema-markup',
      section: 'technical',
      sectionTitle: 'Technical SEO',
      title: schemaRec.title,
      status: hasSchema ? 'good' : 'critical',
      why: schemaRec.why,
      action: hasSchema ? schemaRec.actions.good : schemaRec.actions.critical,
      details: hasSchema
        ? ['LocalBusiness schema detected']
        : ['No LocalBusiness schema found', 'This is critical for local pack rankings'],
      priority: hasSchema ? 10 : 1,
      value: hasSchema ? 'present' : 'missing',
    })

    // HTTPS
    const isHttps = onPage.checks?.is_https !== false
    const httpsRec = LOCAL_SEO_RECOMMENDATIONS[0]?.items[5] // https
    if (!httpsRec) return items

    items.push({
      id: 'https',
      section: 'technical',
      sectionTitle: 'Technical SEO',
      title: httpsRec.title,
      status: isHttps ? 'good' : 'critical',
      why: httpsRec.why,
      action: isHttps ? httpsRec.actions.good : httpsRec.actions.critical,
      details: isHttps ? ['Site is secure'] : ['Site not using HTTPS - URGENT'],
      priority: isHttps ? 10 : 1,
      value: isHttps ? 'yes' : 'no',
    })

    // Mobile Friendly
    const isMobileFriendly = onPage.checks?.is_mobile_friendly !== false
    const mobileRec = LOCAL_SEO_RECOMMENDATIONS[0]?.items[6] // mobile-friendly
    if (!mobileRec) return items

    items.push({
      id: 'mobile-friendly',
      section: 'technical',
      sectionTitle: 'Technical SEO',
      title: mobileRec.title,
      status: isMobileFriendly ? 'good' : 'critical',
      why: mobileRec.why,
      action: isMobileFriendly ? mobileRec.actions.good : mobileRec.actions.critical,
      details: isMobileFriendly ? ['Mobile-friendly design detected'] : ['Site is not mobile-friendly'],
      priority: isMobileFriendly ? 10 : 2,
      value: isMobileFriendly ? 'yes' : 'no',
    })
  }

  // ON-SITE OPTIMIZATION
  if (auditData.onPage) {
    const onPage = auditData.onPage

    // Title Tags
    const hasTitle = onPage.checks?.has_title !== false
    const hasLocationInTitle = onPage.title?.match(/in [A-Z][a-z]+,?\s*[A-Z]{2}/i) || false
    const titleRec = LOCAL_SEO_RECOMMENDATIONS[1]?.items[0] // title-tags
    if (!titleRec) return items

    items.push({
      id: 'title-tags',
      section: 'onsite',
      sectionTitle: 'On-Site Optimization',
      title: titleRec.title,
      status: hasTitle && hasLocationInTitle ? 'good' : hasTitle ? 'warning' : 'critical',
      why: titleRec.why,
      action: hasTitle && hasLocationInTitle ? titleRec.actions.good : hasTitle ? titleRec.actions.warning : titleRec.actions.critical,
      details: hasTitle
        ? hasLocationInTitle
          ? ['Title includes location keyword']
          : ['Title exists but missing location keyword', 'Use format: "Service in City, State | Brand"']
        : ['Title tag is missing'],
      priority: !hasTitle ? 1 : !hasLocationInTitle ? 4 : 10,
      value: hasTitle ? (hasLocationInTitle ? 'optimized' : 'needs location') : 'missing',
    })

    // Meta Description
    const hasDescription = onPage.checks?.has_meta_description !== false
    const descLength = onPage.meta_description?.length || 0
    const descRec = LOCAL_SEO_RECOMMENDATIONS[1]?.items[1] // meta-descriptions
    if (!descRec) return items

    items.push({
      id: 'meta-descriptions',
      section: 'onsite',
      sectionTitle: 'On-Site Optimization',
      title: descRec.title,
      status: hasDescription && descLength >= 150 ? 'good' : hasDescription ? 'warning' : 'critical',
      why: descRec.why,
      action:
        hasDescription && descLength >= 150
          ? descRec.actions.good
          : hasDescription
            ? descRec.actions.warning
            : descRec.actions.critical,
      details: hasDescription
        ? [`${descLength} characters`, descLength < 150 ? 'Expand to 150-160 characters' : 'Good length']
        : ['Meta description missing'],
      priority: !hasDescription ? 3 : descLength < 100 ? 5 : 10,
      value: descLength,
    })

    // H1 Tags
    const hasH1 = onPage.checks?.has_h1 !== false
    const h1Rec = LOCAL_SEO_RECOMMENDATIONS[1]?.items[2] // h1-tags
    if (!h1Rec) return items

    items.push({
      id: 'h1-tags',
      section: 'onsite',
      sectionTitle: 'On-Site Optimization',
      title: h1Rec.title,
      status: hasH1 ? 'good' : 'warning',
      why: h1Rec.why,
      action: hasH1 ? h1Rec.actions.good : h1Rec.actions.critical,
      details: hasH1 ? ['H1 tag present'] : ['H1 tag missing', 'Add one H1 with primary keyword + location'],
      priority: hasH1 ? 10 : 4,
      value: hasH1 ? 'yes' : 'no',
    })

    // Content Length
    const wordCount = onPage.content?.word_count || onPage.word_count || 0
    const contentRec = LOCAL_SEO_RECOMMENDATIONS[1]?.items[4] // content-optimization
    if (!contentRec) return items

    items.push({
      id: 'content-optimization',
      section: 'onsite',
      sectionTitle: 'On-Site Optimization',
      title: contentRec.title,
      status: wordCount >= 1000 ? 'good' : wordCount >= 500 ? 'warning' : 'critical',
      why: contentRec.why,
      action:
        wordCount >= 1000 ? contentRec.actions.good : wordCount >= 500 ? contentRec.actions.warning : contentRec.actions.critical,
      details:
        wordCount >= 1000
          ? [`${wordCount} words - comprehensive`]
          : [`${wordCount} words - expand to 1000+`, 'Add: service details, FAQs, benefits, local mentions'],
      priority: wordCount < 500 ? 3 : wordCount < 1000 ? 6 : 10,
      value: wordCount,
    })
  }

  // GOOGLE BUSINESS PROFILE
  if (auditData.business) {
    const business = auditData.business

    // Reviews
    const reviewCount = business.rating?.votes_count || business.reviews_count || 0
    const rating = business.rating?.value || business.rating_value || 0
    const reviewRec = LOCAL_SEO_RECOMMENDATIONS[2]?.items[5] // gbp-reviews
    if (!reviewRec) return items

    items.push({
      id: 'gbp-reviews',
      section: 'gbp',
      sectionTitle: 'Google Business Profile',
      title: reviewRec.title,
      status: reviewCount >= 50 && rating >= 4.5 ? 'good' : reviewCount >= 20 ? 'warning' : 'critical',
      why: reviewRec.why,
      action:
        reviewCount >= 50 && rating >= 4.5
          ? reviewRec.actions.good
          : reviewCount >= 20
            ? reviewRec.actions.warning
            : reviewRec.actions.critical,
      details:
        reviewCount > 0
          ? [`${reviewCount} reviews`, `${rating.toFixed(1)} star rating`, reviewCount < 50 ? 'Aim for 50+ reviews' : 'Great!']
          : ['No reviews found', 'Start review generation campaign'],
      priority: reviewCount < 20 ? 2 : reviewCount < 50 ? 5 : 10,
      value: reviewCount,
    })

    // Q&As
    const qaCount = business.questions_and_answers?.length || business.qa_count || 0
    const qaRec = LOCAL_SEO_RECOMMENDATIONS[2]?.items[1] // gbp-qanda
    if (!qaRec) return items

    items.push({
      id: 'gbp-qanda',
      section: 'gbp',
      sectionTitle: 'Google Business Profile',
      title: qaRec.title,
      status: qaCount >= 20 ? 'good' : qaCount >= 5 ? 'warning' : 'critical',
      why: qaRec.why,
      action: qaCount >= 20 ? qaRec.actions.good : qaCount >= 5 ? qaRec.actions.warning : qaRec.actions.critical,
      details:
        qaCount >= 20
          ? [`${qaCount} Q&As - excellent coverage`]
          : [`${qaCount} Q&As found`, 'Add FAQs about: services, pricing, hours, insurance, parking'],
      priority: qaCount < 5 ? 2 : qaCount < 20 ? 5 : 10,
      value: qaCount,
    })

    // Photos
    const photoCount = business.photos?.length || business.photo_count || 0
    const photoRec = LOCAL_SEO_RECOMMENDATIONS[2]?.items[6] // gbp-photos
    if (!photoRec) return items

    items.push({
      id: 'gbp-photos',
      section: 'gbp',
      sectionTitle: 'Google Business Profile',
      title: photoRec.title,
      status: photoCount >= 20 ? 'good' : photoCount >= 5 ? 'warning' : 'critical',
      why: photoRec.why,
      action: photoCount >= 20 ? photoRec.actions.good : photoCount >= 5 ? photoRec.actions.warning : photoRec.actions.critical,
      details:
        photoCount >= 20
          ? [`${photoCount} photos uploaded`]
          : [`${photoCount} photos found`, 'Add: exterior (2+), interior (5+), team (3+), equipment'],
      priority: photoCount < 5 ? 3 : photoCount < 20 ? 6 : 10,
      value: photoCount,
    })
  }

  // Sort by priority (lower number = higher priority)
  return items.sort((a, b) => a.priority - b.priority)
}

/**
 * Get summary statistics from action plan
 */
export function getActionPlanSummary(items: ActionItem[]) {
  const bySection = {
    technical: items.filter((i) => i.section === 'technical'),
    onsite: items.filter((i) => i.section === 'onsite'),
    gbp: items.filter((i) => i.section === 'gbp'),
  }

  const byStatus = {
    critical: items.filter((i) => i.status === 'critical').length,
    warning: items.filter((i) => i.status === 'warning').length,
    good: items.filter((i) => i.status === 'good').length,
  }

  return {
    total: items.length,
    bySection,
    byStatus,
    criticalItems: items.filter((i) => i.status === 'critical'),
    topPriority: items.slice(0, 5), // Top 5 priority items
  }
}
