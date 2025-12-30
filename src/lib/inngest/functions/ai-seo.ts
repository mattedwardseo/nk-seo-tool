/**
 * AI SEO Analysis Inngest Function
 * 
 * Processes AI SEO analysis runs by calling DataForSEO's AI Optimization APIs
 * and storing results in the database.
 */

import { inngest } from '@/lib/inngest'
import {
  searchLLMMentionsLive,
  getAIKeywordSearchVolume,
  queryChatGPT,
  queryGoogleAIOverview,
  queryGemini,
  queryPerplexity,
  type LLMResponsesResult,
} from '@/lib/dataforseo/modules/ai-optimization'
import {
  updateAISeoRunStatus,
  createAISeoResult,
  completeAISeoRun,
  failAISeoRun,
} from '@/lib/db/ai-seo-operations'

// Event type for AI SEO analysis
export interface AISeoAnalysisEvent {
  name: 'ai-seo/analysis.start'
  data: {
    runId: string
    domainId: string
    domain: string
    businessName: string
    keywords: string[]
    llmPlatforms: string[]
    city?: string
    state?: string
    locationCode?: number
  }
}

/**
 * Process AI SEO Research Analysis
 * 
 * Uses LLM Responses API to get actual AI answers for local SEO research:
 * 1. Query LLM Responses API for each keyword to get full AI answers
 * 2. Extract insights: citations, related questions, competitor mentions
 * 3. Use LLM Mentions API to check domain visibility
 * 4. Generate actionable recommendations
 * 5. Store full research data in database
 */
export const processAISeoAnalysis = inngest.createFunction(
  {
    id: 'ai-seo-analysis',
    name: 'AI SEO Analysis',
    retries: 3,
    throttle: {
      limit: 5,
      period: '1m',
    },
  },
  { event: 'ai-seo/analysis.start' },
  async ({ event, step }) => {
    const eventData = event.data as AISeoAnalysisEvent['data']
    const {
      runId,
      domain,
      businessName,
      keywords,
      llmPlatforms,
      locationCode = 2840, // Default to US
    } = eventData

    try {

      // Step 1: Update status to running
      await step.run('update-status-running', async () => {
        await updateAISeoRunStatus(runId, 'RUNNING')
      })

      // Step 2: Get AI keyword search volume for insights
      const keywordData = await step.run('get-ai-keyword-volume', async () => {
        try {
          const results = await getAIKeywordSearchVolume(keywords.slice(0, 20), {
            locationCode,
            languageCode: 'en',
          })
          return results
        } catch (error) {
          console.error('Error getting AI keyword volume:', error)
          return []
        }
      })

    // Step 3: Research AI Responses for each keyword/platform
    // This gives us actual insights: what AI says, what it cites, related questions
    const platformResults: {
      platform: string
      mentionRate: number
      citationRate: number
      impressions: number
      mentionsCount: number
    }[] = []

    const keywordResearch: Array<{
      keyword: string
      platform: string
      // LLM Response data
      aiAnswer?: string
      citations?: Array<{ url: string; title: string; domain: string }>
      relatedQuestions?: string[]
      competitorMentions?: Array<{ name: string; url?: string; type: string }>
      // Mention tracking
      isMentioned: boolean
      isCited: boolean
      mentionContext?: string
      mentionRank?: number
      // Metadata
      aiSearchVolume?: number
      rawResponse?: LLMResponsesResult
    }> = []

    // Map platform names to query functions
    const platformMap: Record<string, (keyword: string, options: { locationCode: number }) => Promise<LLMResponsesResult | null>> = {
      'chatgpt': queryChatGPT,
      'chat_gpt': queryChatGPT,
      'ChatGPT': queryChatGPT,
      'google': queryGoogleAIOverview,
      'Google AI Overview': queryGoogleAIOverview,
      'gemini': queryGemini,
      'Gemini': queryGemini,
      'perplexity': queryPerplexity,
      'Perplexity': queryPerplexity,
    }

    // Process each platform
    for (const platformName of llmPlatforms) {
      const queryFunction = platformMap[platformName.toLowerCase()] || platformMap[platformName]
      if (!queryFunction) continue

      const platformResult = await step.run(`research-${platformName}`, async () => {
        let platformMentions = 0
        let platformCitations = 0
        let platformImpressions = 0
        const research: typeof keywordResearch = []

        // Limit to 10 keywords to control costs
        for (const keyword of keywords.slice(0, 10)) {
          try {
            // Use LLM Responses API to get actual AI answer
            const response = await queryFunction(keyword, { locationCode })
            
            if (response && response.items && response.items.length > 0) {
              const item = response.items[0] // Get first/main response
              if (!item) continue

              // Extract citations
              const citations = item.citations?.map(c => ({
                url: c.url,
                title: c.title,
                domain: c.domain,
              })) || []
              
              // Check if our domain is cited
              const isCited = citations.some(c => 
                c.domain.toLowerCase().includes(domain.toLowerCase())
              )
              
              // Extract competitor mentions (brand mentions that aren't us)
              const competitors = item.brand_mentions?.filter(b => 
                b.name.toLowerCase() !== businessName.toLowerCase() &&
                b.name.toLowerCase() !== domain.toLowerCase()
              ).map(b => ({
                name: b.name,
                url: b.url,
                type: b.type,
              })) || []
              
              // Check if business/domain is mentioned in answer
              const answerLower = (item.answer || '').toLowerCase()
              const businessLower = businessName.toLowerCase()
              const domainLower = domain.toLowerCase()
              const isMentioned = answerLower.includes(businessLower) || answerLower.includes(domainLower)
              
              // Get mention context if mentioned
              let mentionContext: string | undefined
              let mentionRank: number | undefined
              if (isMentioned) {
                // Find position in answer
                const businessIndex = answerLower.indexOf(businessLower)
                const domainIndex = answerLower.indexOf(domainLower)
                const mentionIndex = businessIndex >= 0 ? businessIndex : domainIndex
                
                if (mentionIndex >= 0) {
                  // Extract context around mention (200 chars before/after)
                  const start = Math.max(0, mentionIndex - 200)
                  const end = Math.min(item.answer.length, mentionIndex + businessLower.length + 200)
                  mentionContext = item.answer.substring(start, end)
                  mentionRank = 1 // First mention if present
                }
              }
              
              // Get AI search volume for this keyword
              const volumeData = keywordData.find(k => k.keyword === keyword)
              
              research.push({
                keyword,
                platform: platformName,
                aiAnswer: item.answer,
                citations,
                relatedQuestions: item.related_questions || [],
                competitorMentions: competitors,
                isMentioned,
                isCited,
                mentionContext,
                mentionRank,
                aiSearchVolume: volumeData?.ai_search_volume,
                rawResponse: response,
              })
              
              if (isMentioned) {
                platformMentions++
              }
              if (isCited) {
                platformCitations++
              }
              if (volumeData?.impressions) {
                platformImpressions += volumeData.impressions
              }
            } else {
              // No response - also check mentions API as fallback
              try {
                const mentionResult = await searchLLMMentionsLive({
                  target: [
                    { domain, search_filter: 'include' },
                    { keyword, search_filter: 'include', match_type: 'word_match' },
                  ],
                  location_code: locationCode,
                  language_code: 'en',
                  ai_platform: platformName === 'google' || platformName === 'Google AI Overview' ? 'google' : 'chat_gpt',
                  limit: 10,
                })
                
                const isMentioned = Boolean(mentionResult && mentionResult.items_count > 0)
                if (isMentioned) {
                  platformMentions++
                }

                research.push({
                  keyword,
                  platform: platformName,
                  isMentioned,
                  isCited: false,
                })
              } catch (mentionError) {
                // Fallback failed too - just record as not mentioned
                research.push({
                  keyword,
                  platform: platformName,
                  isMentioned: false,
                  isCited: false,
                })
              }
            }
          } catch (error) {
            console.error(`Error researching ${platformName} for keyword "${keyword}":`, error)
            research.push({
              keyword,
              platform: platformName,
              isMentioned: false,
              isCited: false,
            })
          }
        }

        const keywordsChecked = Math.min(keywords.length, 10)
        return {
          platformScore: {
            platform: platformName,
            // Mention rate: how many keywords resulted in at least one mention
            mentionRate: keywordsChecked > 0 
              ? research.filter(r => r.isMentioned).length / keywordsChecked 
              : 0,
            // Citation rate: how many mentions included domain citations
            citationRate: platformMentions > 0 
              ? platformCitations / platformMentions 
              : 0,
            impressions: platformImpressions,
            mentionsCount: platformMentions,
          },
          research,
        }
      })

      platformResults.push(platformResult.platformScore)
      keywordResearch.push(...platformResult.research)
    }

    // Step 4: Calculate overall scores
    const totals = await step.run('calculate-totals', async () => {
      const totalMentions = platformResults.reduce((sum, p) => sum + p.mentionsCount, 0)
      const totalImpressions = platformResults.reduce((sum, p) => sum + p.impressions, 0)

      // Calculate averages (handle empty array case)
      const avgMentionRate = platformResults.length > 0
        ? platformResults.reduce((sum, p) => sum + p.mentionRate, 0) / platformResults.length
        : 0
      const avgCitationRate = platformResults.length > 0
        ? platformResults.reduce((sum, p) => sum + p.citationRate, 0) / platformResults.length
        : 0

      // Calculate visibility score (0-100)
      // Weighted: 60% mention rate, 40% citation rate
      const visibilityScore = Math.round(Math.min(100, Math.max(0, (avgMentionRate * 0.6 + avgCitationRate * 0.4) * 100)))

      return {
        totalMentions,
        totalCitations: totalMentions > 0 ? Math.round(avgCitationRate * totalMentions) : 0,
        visibilityScore,
        avgMentionRate,
        avgCitationRate,
        totalImpressions,
      }
    })

    // Step 5: Store results for each platform
    await step.run('store-platform-results', async () => {
      for (const platform of platformResults) {
        await createAISeoResult({
          runId,
          llmPlatform: platform.platform,
          keyword: null, // Platform-level aggregate
          mentionRate: platform.mentionRate,
          citationRate: platform.citationRate,
          visibilityScore: Math.round((platform.mentionRate * 0.6 + platform.citationRate * 0.4) * 100),
          sentimentScore: 0, // Would need additional analysis
          impressions: platform.impressions,
          mentionsCount: platform.mentionsCount,
          rawResponse: JSON.stringify({ 
            platform: platform.platform,
            mentionRate: platform.mentionRate,
            citationRate: platform.citationRate,
            impressions: platform.impressions,
            mentionsCount: platform.mentionsCount,
          }),
        })
      }
    })

    // Step 6: Store keyword-level research results
    await step.run('store-keyword-results', async () => {
      // Group research by keyword
      const keywordGroups = new Map<string, typeof keywordResearch>()
      for (const research of keywordResearch) {
        if (!keywordGroups.has(research.keyword)) {
          keywordGroups.set(research.keyword, [])
        }
        keywordGroups.get(research.keyword)!.push(research)
      }

      for (const [keyword, researchItems] of keywordGroups) {
        // Aggregate across platforms for this keyword
        const mentionedCount = researchItems.filter(r => r.isMentioned).length
        const citedCount = researchItems.filter(r => r.isCited).length
        const mentionRate = researchItems.length > 0 ? mentionedCount / researchItems.length : 0
        const citationRate = mentionedCount > 0 ? citedCount / mentionedCount : 0
        
        // Collect all insights: citations, related questions, competitors
        const allCitations = researchItems
          .flatMap(r => r.citations || [])
          .filter((c, index, arr) => 
            arr.findIndex(other => other.url === c.url) === index // Dedupe by URL
          )
        
        const allRelatedQuestions = researchItems
          .flatMap(r => r.relatedQuestions || [])
          .filter((q, index, arr) => arr.indexOf(q) === index) // Dedupe
        
        const allCompetitors = researchItems
          .flatMap(r => r.competitorMentions || [])
          .filter((c, index, arr) =>
            arr.findIndex(other => other.name === c.name) === index // Dedupe by name
          )
        
        // Store full research data
        await createAISeoResult({
          runId,
          llmPlatform: 'all',
          keyword,
          mentionRate,
          citationRate,
          visibilityScore: Math.round((mentionRate * 0.6 + citationRate * 0.4) * 100),
          sentimentScore: 0,
          impressions: researchItems.reduce((sum, r) => sum + (r.aiSearchVolume || 0), 0),
          mentionsCount: mentionedCount,
          rawResponse: JSON.stringify({
            platforms: researchItems.map(r => ({
              platform: r.platform,
              aiAnswer: r.aiAnswer?.substring(0, 500), // Store truncated answer
              citations: r.citations,
              relatedQuestions: r.relatedQuestions,
              competitorMentions: r.competitorMentions,
              isMentioned: r.isMentioned,
              isCited: r.isCited,
            })),
            aggregated: {
              allCitations,
              allRelatedQuestions,
              allCompetitors,
            },
          }),
        })
        
        // Also store per-platform results for detailed analysis
        for (const research of researchItems) {
          await createAISeoResult({
            runId,
            llmPlatform: research.platform,
            keyword,
            mentionRate: research.isMentioned ? 1 : 0,
            citationRate: research.isCited ? 1 : 0,
            visibilityScore: research.isMentioned ? (research.isCited ? 100 : 60) : 0,
            sentimentScore: 0,
            impressions: research.aiSearchVolume || 0,
            mentionsCount: research.isMentioned ? 1 : 0,
            rawResponse: JSON.stringify({
              aiAnswer: research.aiAnswer,
              citations: research.citations,
              relatedQuestions: research.relatedQuestions,
              competitorMentions: research.competitorMentions,
              mentionContext: research.mentionContext,
              mentionRank: research.mentionRank,
            }),
          })
        }
      }
    })

    // Step 7: Generate actionable insights from research
    const recommendations = await step.run('generate-insights', async () => {
      const recs: { priority: string; category: string; suggestion: string }[] = []
      
      // Collect all unique citations to see what sources AI trusts
      const allCitations = keywordResearch
        .flatMap(r => r.citations || [])
        .filter((c, index, arr) => arr.findIndex(other => other.domain === c.domain) === index)
      
      // Collect all related questions
      const allRelatedQuestions = keywordResearch
        .flatMap(r => r.relatedQuestions || [])
        .filter((q, index, arr) => arr.indexOf(q) === index)
        .slice(0, 10) // Top 10
      
      // Collect all competitor mentions
      const allCompetitors = keywordResearch
        .flatMap(r => r.competitorMentions || [])
        .filter((c, index, arr) => arr.findIndex(other => other.name === c.name) === index)
      
      // Generate insights based on research data
      
      // Insight: Citation opportunities
      if (allCitations.length > 0) {
        const citationDomains = allCitations.map(c => c.domain).slice(0, 5)
        recs.push({
          priority: 'high',
          category: 'Citation Opportunities',
          suggestion: `AI frequently cites these domains: ${citationDomains.join(', ')}. Consider getting backlinks or mentions from these trusted sources to improve your visibility.`,
        })
      }
      
      // Insight: Related questions to answer
      if (allRelatedQuestions.length > 0) {
        recs.push({
          priority: 'high',
          category: 'Content Opportunities',
          suggestion: `Create FAQ content answering these questions AI users ask: ${allRelatedQuestions.slice(0, 3).join(', ')}. This content has high potential to be cited.`,
        })
      }
      
      // Insight: Competitor analysis
      if (allCompetitors.length > 0) {
        const competitorNames = allCompetitors.map(c => c.name).slice(0, 3)
        recs.push({
          priority: 'medium',
          category: 'Competitive Intelligence',
          suggestion: `AI frequently recommends these competitors: ${competitorNames.join(', ')}. Research what makes them visible and apply similar strategies.`,
        })
      }
      
      // Insight: Low visibility
      if (totals.visibilityScore < 30) {
        recs.push({
          priority: 'high',
          category: 'Visibility Gap',
          suggestion: `${businessName} has low visibility in AI responses (${totals.visibilityScore}% score). Focus on creating authoritative content that answers common local queries with clear, structured information.`,
        })
      }
      
      // Insight: Missing citations
      if (totals.totalCitations === 0 && totals.totalMentions > 0) {
        recs.push({
          priority: 'high',
          category: 'Citation Gap',
          suggestion: 'Your business is mentioned but not cited. Add Schema.org markup, clear page titles, and ensure content is structured so AI can easily extract and cite your information.',
        })
      }
      
      // Insight: No mentions at all
      if (totals.totalMentions === 0) {
        recs.push({
          priority: 'high',
          category: 'Complete Visibility Gap',
          suggestion: `${businessName} is not appearing in AI responses at all. This is a major opportunity. Start by creating comprehensive service pages, location-specific content, and getting listed on authoritative health directories.`,
        })
      }
      
      // Insight: Content gaps based on AI answers
      const keywordsWithAnswers = keywordResearch.filter(r => r.aiAnswer && r.aiAnswer.length > 100)
      if (keywordsWithAnswers.length > 0 && totals.totalMentions === 0) {
        recs.push({
          priority: 'high',
          category: 'Content Strategy',
          suggestion: `AI provides detailed answers for ${keywordsWithAnswers.length} of your keywords, but doesn't mention ${businessName}. Review what AI says and create content that matches that depth and structure.`,
        })
      }
      
      // Insight: Good visibility maintenance
      if (totals.visibilityScore >= 60) {
        recs.push({
          priority: 'low',
          category: 'Maintenance',
          suggestion: 'Your AI visibility is strong. Continue monitoring, keep content fresh, maintain positive reviews, and track competitor mentions.',
        })
      }

      return recs
    })

    // Step 8: Complete the run with recommendations
    await step.run('complete-run', async () => {
      await completeAISeoRun(runId, {
        visibilityScore: totals.visibilityScore,
        totalMentions: totals.totalMentions,
        totalCitations: totals.totalCitations,
        recommendations: JSON.stringify(recommendations),
      })
    })

      return {
        success: true,
        runId,
        visibilityScore: totals.visibilityScore,
        totalMentions: totals.totalMentions,
        platformResults,
        recommendations,
      }
    } catch (error) {
      // Mark run as failed
      await step.run('mark-failed', async () => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        await failAISeoRun(runId, errorMessage)
      })
      
      // Re-throw to let Inngest handle retries
      throw error
    }
  }
)

// Export all AI SEO functions for registration
export const aiSeoFunctions = [processAISeoAnalysis]

