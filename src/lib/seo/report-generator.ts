/**
 * SEO Report Generator
 *
 * Uses Claude API to synthesize DataForSEO data into
 * comprehensive keyword optimization reports.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { KeywordOptimizationData } from './keyword-optimization-service'

// Initialize Anthropic client
const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new Anthropic({ apiKey })
}

// Structured report data for UI
export interface KeywordOptimizationReport {
  // Summary scores (0-10)
  scores: {
    overall: number
    title: number
    meta: number
    headings: number
    content: number
    internalLinks: number
  }

  // Executive summary
  executiveSummary: {
    currentPosition: number | null
    primaryOpportunity: string
    competitiveGap: string
    estimatedImpact: string
  }

  // On-page analysis
  onPageAnalysis: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }

  // Keyword gaps
  keywordGaps: Array<{
    keyword: string
    searchVolume: number | null
    difficulty: number | null
    priority: 'high' | 'medium' | 'low'
    recommendation: string
  }>

  // Competitor insights
  competitorInsights: {
    topCompetitor: string
    positionGap: number
    keyDifferentiators: string[]
  }

  // Action items (prioritized)
  actionItems: Array<{
    priority: 1 | 2 | 3 // 1 = immediate, 2 = short-term, 3 = medium-term
    category: string
    action: string
    expectedImpact: string
  }>

  // Full markdown report
  markdownReport: string
}

/**
 * Generate a comprehensive keyword optimization report using Claude
 */
export async function generateKeywordOptimizationReport(
  url: string,
  data: KeywordOptimizationData
): Promise<KeywordOptimizationReport> {
  const anthropic = getAnthropicClient()

  // Build the prompt with all the data
  const prompt = buildAnalysisPrompt(url, data)

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  // Extract text from response
  const textContent = response.content.find((block) => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse the structured response
  return parseClaudeResponse(textContent.text, data)
}

/**
 * Build the analysis prompt with all gathered data
 */
function buildAnalysisPrompt(url: string, data: KeywordOptimizationData): string {
  const volumeNote =
    data.volumeSource === 'historical'
      ? `(Note: Search volume from historical data - ${data.historicalDate} - as current data is unavailable for this keyword)`
      : ''

  return `You are an expert SEO analyst. Analyze the following data and provide a comprehensive keyword optimization report.

## Target Information
- **URL**: ${url}
- **Target Keyword**: "${data.targetKeyword}"
- **Search Volume**: ${data.searchVolume ?? 'N/A'} ${volumeNote}
- **CPC**: $${data.cpc?.toFixed(2) ?? 'N/A'}
- **Keyword Difficulty**: ${data.keywordDifficulty ?? 'N/A'}/100
- **Current SERP Position**: ${data.currentPosition ?? 'Not ranking in top 20'}
- **Search Intent**: ${data.searchIntent ?? 'Unknown'}

## Domain Metrics
- **Domain Rank**: ${data.domainRank ?? 'N/A'}
- **Organic Keywords**: ${data.organicKeywordsCount.toLocaleString()}
- **Estimated Traffic Value**: $${data.estimatedTrafficValue.toLocaleString()}/month
- **Referring Domains**: ${data.referringDomains.toLocaleString()}
- **Total Backlinks**: ${data.backlinks.toLocaleString()}
- **Spam Score**: ${data.spamScore ?? 'N/A'}

## SERP Analysis
- **Organic Results**: ${data.serpFeatures.organicResultsCount}
- **Has Local Pack**: ${data.serpFeatures.hasLocalPack ? 'Yes' : 'No'}
- **Has Featured Snippet**: ${data.serpFeatures.hasFeaturedSnippet ? 'Yes' : 'No'}
- **Has People Also Ask**: ${data.serpFeatures.hasPeopleAlsoAsk ? 'Yes' : 'No'}

## Top Competitors (SERP)
${data.topCompetitors
  .slice(0, 5)
  .map((c, i) => `${i + 1}. ${c.domain} - Position #${c.position}`)
  .join('\n')}

## Current Keyword Rankings
${data.rankedKeywords
  .slice(0, 15)
  .map((k) => `- "${k.keyword}" - Position #${k.position} (${k.searchVolume ?? 'N/A'} vol, $${k.cpc?.toFixed(2) ?? 'N/A'} CPC)`)
  .join('\n')}

## Keyword Opportunities
${data.keywordOpportunities
  .slice(0, 15)
  .map((k) => `- "${k.keyword}" - ${k.searchVolume ?? 'N/A'} vol, difficulty ${k.difficulty ?? 'N/A'}, intent: ${k.intent ?? 'unknown'}`)
  .join('\n')}

---

Please provide your analysis in the following JSON format (output ONLY valid JSON, no markdown code blocks):

{
  "scores": {
    "overall": <0-100 based on current optimization state>,
    "title": <0-10 estimated based on domain ranking for keyword>,
    "meta": <0-10 estimated>,
    "headings": <0-10 estimated>,
    "content": <0-10 estimated based on ranking data>,
    "internalLinks": <0-10 estimated>
  },
  "executiveSummary": {
    "currentPosition": ${data.currentPosition ?? 'null'},
    "primaryOpportunity": "<one sentence about the biggest opportunity>",
    "competitiveGap": "<one sentence about gap to top competitor>",
    "estimatedImpact": "<potential traffic/revenue impact>"
  },
  "onPageAnalysis": {
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
    "recommendations": ["<specific recommendation 1>", "<specific recommendation 2>", ...]
  },
  "keywordGaps": [
    {
      "keyword": "<missing keyword opportunity>",
      "searchVolume": <number or null>,
      "difficulty": <number or null>,
      "priority": "high|medium|low",
      "recommendation": "<specific action to target this keyword>"
    }
  ],
  "competitorInsights": {
    "topCompetitor": "<domain of top competitor>",
    "positionGap": <positions behind leader>,
    "keyDifferentiators": ["<what competitors do better>", ...]
  },
  "actionItems": [
    {
      "priority": 1,
      "category": "On-Page SEO|Content|Technical|Backlinks",
      "action": "<specific actionable task>",
      "expectedImpact": "<expected result>"
    }
  ]
}

Focus on:
1. Practical, actionable recommendations
2. Dental/local service industry best practices
3. Quick wins vs long-term strategies
4. Specific keyword opportunities from the data provided`
}

/**
 * Parse Claude's response and generate the full report
 */
function parseClaudeResponse(
  responseText: string,
  data: KeywordOptimizationData
): KeywordOptimizationReport {
  // Try to parse JSON from response
  let parsed: {
    scores: {
      overall: number
      title: number
      meta: number
      headings: number
      content: number
      internalLinks: number
    }
    executiveSummary: {
      currentPosition: number | null
      primaryOpportunity: string
      competitiveGap: string
      estimatedImpact: string
    }
    onPageAnalysis: {
      strengths: string[]
      weaknesses: string[]
      recommendations: string[]
    }
    keywordGaps: Array<{
      keyword: string
      searchVolume: number | null
      difficulty: number | null
      priority: 'high' | 'medium' | 'low'
      recommendation: string
    }>
    competitorInsights: {
      topCompetitor: string
      positionGap: number
      keyDifferentiators: string[]
    }
    actionItems: Array<{
      priority: 1 | 2 | 3
      category: string
      action: string
      expectedImpact: string
    }>
  }

  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('No JSON found in response')
    }
  } catch {
    // If parsing fails, create default structure
    parsed = createDefaultReport(data)
  }

  // Generate markdown report
  const markdownReport = generateMarkdownReport(data, parsed)

  return {
    scores: parsed.scores,
    executiveSummary: parsed.executiveSummary,
    onPageAnalysis: parsed.onPageAnalysis,
    keywordGaps: parsed.keywordGaps,
    competitorInsights: parsed.competitorInsights,
    actionItems: parsed.actionItems,
    markdownReport,
  }
}

/**
 * Create a default report structure if Claude parsing fails
 */
function createDefaultReport(data: KeywordOptimizationData) {
  return {
    scores: {
      overall: 50,
      title: 5,
      meta: 5,
      headings: 5,
      content: 5,
      internalLinks: 5,
    },
    executiveSummary: {
      currentPosition: data.currentPosition,
      primaryOpportunity: 'Improve keyword targeting and on-page optimization',
      competitiveGap: `${data.topCompetitors[0]?.domain || 'Competitors'} outranks for target keyword`,
      estimatedImpact: 'Potential for significant traffic increase with optimization',
    },
    onPageAnalysis: {
      strengths: data.rankedKeywords.length > 0 ? ['Already ranking for related keywords'] : [],
      weaknesses: data.currentPosition === null ? ['Not ranking for target keyword'] : [],
      recommendations: ['Optimize page title for target keyword', 'Improve meta description'],
    },
    keywordGaps: data.keywordOpportunities.slice(0, 5).map((k) => ({
      keyword: k.keyword,
      searchVolume: k.searchVolume,
      difficulty: k.difficulty,
      priority: 'medium' as const,
      recommendation: `Create or optimize content targeting "${k.keyword}"`,
    })),
    competitorInsights: {
      topCompetitor: data.topCompetitors[0]?.domain || 'Unknown',
      positionGap: data.currentPosition ? data.currentPosition - 1 : 20,
      keyDifferentiators: ['Higher domain authority', 'More comprehensive content'],
    },
    actionItems: [
      {
        priority: 1 as const,
        category: 'On-Page SEO',
        action: 'Add target keyword to page title',
        expectedImpact: 'Improved relevance signal',
      },
    ],
  }
}

// Type for analysis report structure
type AnalysisReport = {
  scores: {
    overall: number
    title: number
    meta: number
    headings: number
    content: number
    internalLinks: number
  }
  executiveSummary: {
    currentPosition: number | null
    primaryOpportunity: string
    competitiveGap: string
    estimatedImpact: string
  }
  onPageAnalysis: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
  keywordGaps: Array<{
    keyword: string
    searchVolume: number | null
    difficulty: number | null
    priority: 'high' | 'medium' | 'low'
    recommendation: string
  }>
  competitorInsights: {
    topCompetitor: string
    positionGap: number
    keyDifferentiators: string[]
  }
  actionItems: Array<{
    priority: 1 | 2 | 3
    category: string
    action: string
    expectedImpact: string
  }>
}

/**
 * Generate a full markdown report
 */
function generateMarkdownReport(
  data: KeywordOptimizationData,
  analysis: AnalysisReport
): string {
  const volumeNote =
    data.volumeSource === 'historical'
      ? ` *(from ${data.historicalDate} - current data unavailable)*`
      : ''

  return `# Keyword Optimization Audit Report

## Executive Summary

| Metric | Value | Assessment |
|--------|-------|------------|
| **Current Position** | ${data.currentPosition ? `#${data.currentPosition}` : 'Not in top 20'} | ${data.currentPosition && data.currentPosition <= 3 ? 'Excellent' : data.currentPosition && data.currentPosition <= 10 ? 'Good' : 'Needs Improvement'} |
| **Search Volume** | ${data.searchVolume?.toLocaleString() ?? 'N/A'}${volumeNote} | - |
| **Keyword Difficulty** | ${data.keywordDifficulty ?? 'N/A'}/100 | ${data.keywordDifficulty && data.keywordDifficulty < 30 ? 'Easy' : data.keywordDifficulty && data.keywordDifficulty < 60 ? 'Moderate' : 'Difficult'} |
| **Domain Rank** | ${data.domainRank ?? 'N/A'} | - |
| **Referring Domains** | ${data.referringDomains.toLocaleString()} | ${data.referringDomains > 100 ? 'Strong' : 'Building'} |

### Key Findings

- **Primary Opportunity**: ${analysis.executiveSummary.primaryOpportunity}
- **Competitive Gap**: ${analysis.executiveSummary.competitiveGap}
- **Estimated Impact**: ${analysis.executiveSummary.estimatedImpact}

---

## Overall Score: ${analysis.scores.overall}/100

| Category | Score | Notes |
|----------|-------|-------|
| Title Optimization | ${analysis.scores.title}/10 | - |
| Meta Description | ${analysis.scores.meta}/10 | - |
| Heading Structure | ${analysis.scores.headings}/10 | - |
| Content Relevance | ${analysis.scores.content}/10 | - |
| Internal Linking | ${analysis.scores.internalLinks}/10 | - |

---

## On-Page Analysis

### Strengths
${analysis.onPageAnalysis.strengths.map((s) => `- ${s}`).join('\n') || '- None identified'}

### Weaknesses
${analysis.onPageAnalysis.weaknesses.map((w) => `- ${w}`).join('\n') || '- None identified'}

### Recommendations
${analysis.onPageAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

## Keyword Gap Analysis

| Keyword | Search Volume | Difficulty | Priority | Action |
|---------|---------------|------------|----------|--------|
${analysis.keywordGaps
  .slice(0, 10)
  .map(
    (k) =>
      `| ${k.keyword} | ${k.searchVolume?.toLocaleString() ?? 'N/A'} | ${k.difficulty ?? 'N/A'} | ${k.priority.toUpperCase()} | ${k.recommendation} |`
  )
  .join('\n')}

---

## Competitor Insights

**Top Competitor**: ${analysis.competitorInsights.topCompetitor}
**Position Gap**: ${analysis.competitorInsights.positionGap} positions behind

### Key Differentiators
${analysis.competitorInsights.keyDifferentiators.map((d) => `- ${d}`).join('\n')}

---

## Current Keyword Rankings

| Keyword | Position | Search Volume | CPC |
|---------|----------|---------------|-----|
${data.rankedKeywords
  .slice(0, 15)
  .map(
    (k) =>
      `| ${k.keyword} | #${k.position} | ${k.searchVolume?.toLocaleString() ?? 'N/A'} | $${k.cpc?.toFixed(2) ?? 'N/A'} |`
  )
  .join('\n')}

---

## Action Plan

### Immediate (Priority 1)
${analysis.actionItems
  .filter((a) => a.priority === 1)
  .map((a) => `- **${a.category}**: ${a.action} → *${a.expectedImpact}*`)
  .join('\n') || '- No immediate actions identified'}

### Short-Term (Priority 2)
${analysis.actionItems
  .filter((a) => a.priority === 2)
  .map((a) => `- **${a.category}**: ${a.action} → *${a.expectedImpact}*`)
  .join('\n') || '- No short-term actions identified'}

### Medium-Term (Priority 3)
${analysis.actionItems
  .filter((a) => a.priority === 3)
  .map((a) => `- **${a.category}**: ${a.action} → *${a.expectedImpact}*`)
  .join('\n') || '- No medium-term actions identified'}

---

## SERP Features

| Feature | Present |
|---------|---------|
| Local Pack | ${data.serpFeatures.hasLocalPack ? 'Yes' : 'No'} |
| Featured Snippet | ${data.serpFeatures.hasFeaturedSnippet ? 'Yes' : 'No'} |
| People Also Ask | ${data.serpFeatures.hasPeopleAlsoAsk ? 'Yes' : 'No'} |

---

## Cost Summary

**API Cost**: $${data.apiCost.toFixed(4)}

---

*Report generated on ${new Date().toISOString().split('T')[0]}*
`
}
