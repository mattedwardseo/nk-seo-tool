/**
 * Business Data API Module
 *
 * Google My Business data - listings, reviews, posts, and Q&A.
 * Critical for dental practice local SEO and reputation management.
 *
 * Supports both Live and Task-based API patterns:
 * - Live: getBusinessInfo(), searchListings()
 * - Task-based: submitPostsTask(), submitQATask(), submitReviewsTask()
 */

import {
  BusinessDataGoogleMyBusinessInfoLiveRequestInfo,
  BusinessDataBusinessListingsSearchLiveRequestInfo,
  BusinessDataGoogleMyBusinessUpdatesTaskPostRequestInfo,
  BusinessDataGoogleQuestionsAndAnswersTaskPostRequestInfo,
  BusinessDataGoogleReviewsTaskPostRequestInfo,
} from 'dataforseo-client'

import { BaseModule, type ExecuteOptions } from './base-module'
import { CacheKeys, CacheTTL } from '../cache'
import {
  businessInfoInputSchema,
  googleReviewsInputSchema,
  searchListingsInputSchema,
  businessPostsTaskInputSchema,
  businessQATaskInputSchema,
  businessReviewsTaskInputSchema,
  type BusinessInfoInput,
  type GoogleReviewsInput,
  type SearchListingsInput,
  type BusinessInfoResult,
  type ReviewItem,
  type BusinessListingItem,
  type BusinessPostsTaskInput,
  type BusinessQATaskInput,
  type BusinessReviewsTaskInput,
  type BusinessTaskReady,
  type BusinessPostsResult,
  type BusinessQAResult,
  type BusinessReviewsResult,
} from '../schemas'

/** Default US location code */
const DEFAULT_LOCATION_CODE = 2840

/**
 * Business Data API module for local SEO and GMB data
 */
export class BusinessModule extends BaseModule {
  /**
   * Get Google My Business info for a search
   * Returns detailed business listings from GMB
   *
   * @param input - Search keyword and location settings
   * @param options - Execution options (caching, rate limiting)
   * @returns Array of business info results
   *
   * @example
   * ```ts
   * const listings = await business.getBusinessInfo({
   *   keyword: 'Smith Family Dentistry Austin TX',
   *   locationCode: 2840,
   * });
   * const primary = listings[0];
   * console.log(`${primary?.title}: ${primary?.rating?.value} stars`);
   * console.log(`Phone: ${primary?.phone}`);
   * ```
   */
  async getBusinessInfo(
    input: BusinessInfoInput,
    options?: ExecuteOptions
  ): Promise<BusinessInfoResult[]> {
    const validated = this.validateInput(businessInfoInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.business.info(validated.keyword, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BusinessDataGoogleMyBusinessInfoLiveRequestInfo()
        request.keyword = validated.keyword
        request.language_code = validated.languageCode
        request.device = validated.device
        request.depth = validated.depth

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        if (validated.os) {
          request.os = validated.os
        }

        return this.client.business.googleMyBusinessInfoLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.GMB, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as BusinessInfoResult[]
  }

  /**
   * Get Google reviews for a business
   * Returns reviews with ratings, text, and owner responses
   *
   * @param input - Business search keyword and options
   * @param options - Execution options
   * @returns Array of review items
   *
   * @example
   * ```ts
   * const reviews = await business.getGoogleReviews({
   *   keyword: 'Smith Family Dentistry Austin TX',
   *   sortBy: 'newest',
   *   depth: 100,
   * });
   * for (const review of reviews) {
   *   console.log(`${review.rating?.value}★: ${review.review_text}`);
   * }
   * ```
   */
  async getGoogleReviews(
    input: GoogleReviewsInput,
    _options?: ExecuteOptions
  ): Promise<ReviewItem[]> {
    // Validate input to ensure it's well-formed
    this.validateInput(googleReviewsInputSchema, input)

    // TODO: Implement using task-based API pattern
    // The Business Data Google Reviews API uses a task-based pattern:
    // 1. Submit task with googleReviewsTaskPost
    // 2. Poll for completion with googleReviewsTasksReady
    // 3. Get results with googleReviewsTaskGet
    // For now, return empty array - reviews can be fetched via search listings

    console.warn(
      'getGoogleReviews: Task-based API not yet implemented. Use searchListings instead.'
    )
    return []
  }

  /**
   * Search business listings by category and location
   * Returns businesses matching criteria from DataForSEO database
   *
   * @param input - Search criteria and filters
   * @param options - Execution options
   * @returns Array of business listing items
   *
   * @example
   * ```ts
   * const dentists = await business.searchListings({
   *   categories: ['Dentist'],
   *   locationCoordinate: '30.2672,-97.7431,25', // Austin, TX, 25km radius
   *   minRating: 4.0,
   *   limit: 50,
   * });
   * console.log(`Found ${dentists.length} dentists with 4+ stars`);
   * ```
   */
  async searchListings(
    input: SearchListingsInput,
    options?: ExecuteOptions
  ): Promise<BusinessListingItem[]> {
    const validated = this.validateInput(searchListingsInputSchema, input)

    // Generate cache key from search parameters
    const cacheKey = CacheKeys.business.listings(
      JSON.stringify({
        categories: validated.categories,
        location: validated.locationCoordinate,
        title: validated.title,
      })
    )

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BusinessDataBusinessListingsSearchLiveRequestInfo()

        if (validated.categories) {
          request.categories = validated.categories
        }
        if (validated.description) {
          request.description = validated.description
        }
        if (validated.title) {
          request.title = validated.title
        }
        if (validated.locationCoordinate) {
          request.location_coordinate = validated.locationCoordinate
        }
        if (validated.isClaimed !== undefined) {
          request.is_claimed = validated.isClaimed
        }
        if (validated.limit) {
          request.limit = validated.limit
        }
        if (validated.offset) {
          request.offset = validated.offset
        }

        // Apply filters for rating
        if (validated.minRating || validated.maxRating) {
          const filters: string[][] = []
          if (validated.minRating) {
            filters.push(['rating.value', '>=', String(validated.minRating)])
          }
          if (validated.maxRating) {
            filters.push(['rating.value', '<=', String(validated.maxRating)])
          }
          if (filters.length > 0) {
            request.filters = filters as unknown as string[]
          }
        }

        return this.client.business.businessListingsSearchLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.GMB, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as BusinessListingItem[]
  }

  /**
   * Analyze reviews for sentiment and patterns
   * Provides summary statistics and common themes
   *
   * @param keyword - Business search keyword
   * @param locationCode - Location code
   * @param depth - Number of reviews to analyze
   * @returns Review analysis object
   *
   * @example
   * ```ts
   * const analysis = await business.analyzeReviews(
   *   'Smith Family Dentistry Austin TX',
   *   2840,
   *   50
   * );
   * console.log(analysis);
   * // {
   * //   averageRating: 4.6,
   * //   totalReviews: 50,
   * //   responseRate: 0.72,
   * //   sentimentBreakdown: { positive: 42, neutral: 5, negative: 3 },
   * //   commonThemes: ['friendly staff', 'clean office', 'minimal wait']
   * // }
   * ```
   */
  async analyzeReviews(
    keyword: string,
    locationCode: number = DEFAULT_LOCATION_CODE,
    depth: number = 50
  ): Promise<{
    averageRating: number
    totalReviews: number
    responseRate: number
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
    sentimentBreakdown: {
      positive: number
      neutral: number
      negative: number
    }
    recentTrend: 'improving' | 'stable' | 'declining'
  }> {
    const reviews = await this.getGoogleReviews({
      keyword,
      locationCode,
      sortBy: 'newest',
      depth,
    })

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        recentTrend: 'stable',
      }
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating?.value ?? 0), 0)
    const averageRating = totalRating / reviews.length

    // Calculate response rate
    const responsesCount = reviews.filter((r) => r.owner_answer).length
    const responseRate = responsesCount / reviews.length

    // Rating distribution
    const ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    for (const review of reviews) {
      const rating = Math.round(review.rating?.value ?? 0)
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++
      }
    }

    // Sentiment breakdown (simplified - based on rating)
    const sentimentBreakdown = {
      positive: reviews.filter((r) => (r.rating?.value ?? 0) >= 4).length,
      neutral: reviews.filter((r) => (r.rating?.value ?? 0) >= 2.5 && (r.rating?.value ?? 0) < 4)
        .length,
      negative: reviews.filter((r) => (r.rating?.value ?? 0) < 2.5).length,
    }

    // Analyze recent trend (compare first half vs second half)
    const midpoint = Math.floor(reviews.length / 2)
    const recentHalf = reviews.slice(0, midpoint)
    const olderHalf = reviews.slice(midpoint)

    const recentAvg =
      recentHalf.reduce((sum, r) => sum + (r.rating?.value ?? 0), 0) / (recentHalf.length || 1)
    const olderAvg =
      olderHalf.reduce((sum, r) => sum + (r.rating?.value ?? 0), 0) / (olderHalf.length || 1)

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (recentAvg - olderAvg > 0.3) {
      recentTrend = 'improving'
    } else if (olderAvg - recentAvg > 0.3) {
      recentTrend = 'declining'
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      responseRate: Math.round(responseRate * 100) / 100,
      ratingDistribution,
      sentimentBreakdown,
      recentTrend,
    }
  }

  /**
   * Get local competitor analysis
   * Finds and compares nearby competing dental practices
   *
   * @param businessName - Name of the target business
   * @param category - Business category (e.g., 'Dentist')
   * @param locationCoordinate - GPS coordinates with radius
   * @returns Competitor analysis
   *
   * @example
   * ```ts
   * const competitors = await business.getLocalCompetitors(
   *   'Smith Family Dentistry',
   *   'Dentist',
   *   '30.2672,-97.7431,10'
   * );
   * console.log(`Found ${competitors.competitors.length} nearby dentists`);
   * ```
   */
  async getLocalCompetitors(
    businessName: string,
    category: string,
    locationCoordinate: string
  ): Promise<{
    targetBusiness: BusinessListingItem | null
    competitors: Array<{
      business: BusinessListingItem
      rating: number
      reviewCount: number
      distance: string
    }>
    averageRating: number
    marketSize: number
  }> {
    // Search for all businesses in the category/area
    const allListings = await this.searchListings({
      categories: [category],
      locationCoordinate,
      limit: 100,
    })

    // Find the target business
    const normalizedName = businessName.toLowerCase()
    const targetBusiness =
      allListings.find((b) => b.title.toLowerCase().includes(normalizedName)) ?? null

    // Get competitors (excluding target)
    const competitors = allListings
      .filter((b) => !targetBusiness || b.place_id !== targetBusiness.place_id)
      .map((b) => ({
        business: b,
        rating: b.rating?.value ?? 0,
        reviewCount: b.rating?.votes_count ?? 0,
        distance: 'nearby', // Would need geocoding to calculate actual distance
      }))
      .sort((a, b) => b.rating - a.rating)

    // Calculate average rating in market
    const totalRating = allListings.reduce((sum, b) => sum + (b.rating?.value ?? 0), 0)
    const averageRating = allListings.length > 0 ? totalRating / allListings.length : 0

    return {
      targetBusiness,
      competitors: competitors.slice(0, 20),
      averageRating: Math.round(averageRating * 10) / 10,
      marketSize: allListings.length,
    }
  }

  /**
   * Get GMB profile completeness score
   * Analyzes how well a business profile is filled out
   *
   * @param businessInfo - Business info result to analyze
   * @returns Completeness score and missing fields
   */
  calculateProfileCompleteness(businessInfo: BusinessInfoResult): {
    score: number
    missingFields: string[]
    recommendations: string[]
  } {
    const missingFields: string[] = []
    const recommendations: string[] = []
    let score = 0
    let maxScore = 0

    // Essential fields (higher weight)
    const essentialFields = [
      { field: 'title', label: 'Business Name', weight: 10 },
      { field: 'phone', label: 'Phone Number', weight: 15 },
      { field: 'address', label: 'Address', weight: 15 },
      { field: 'url', label: 'Website', weight: 10 },
      { field: 'category', label: 'Primary Category', weight: 10 },
    ]

    for (const { field, label, weight } of essentialFields) {
      maxScore += weight
      const value = businessInfo[field as keyof BusinessInfoResult]
      if (value) {
        score += weight
      } else {
        missingFields.push(label)
        recommendations.push(`Add your ${label.toLowerCase()} to improve visibility`)
      }
    }

    // Important fields (medium weight)
    const importantFields = [
      { field: 'description', label: 'Business Description', weight: 8 },
      { field: 'main_image', label: 'Profile Image', weight: 5 },
      { field: 'work_hours', label: 'Business Hours', weight: 8 },
      { field: 'is_claimed', label: 'Claimed Profile', weight: 5 },
    ]

    for (const { field, label, weight } of importantFields) {
      maxScore += weight
      const value = businessInfo[field as keyof BusinessInfoResult]
      if (value) {
        score += weight
      } else {
        missingFields.push(label)
      }
    }

    // Rating (important for trust)
    maxScore += 10
    if (businessInfo.rating?.value && businessInfo.rating.value >= 4) {
      score += 10
    } else if (businessInfo.rating?.value && businessInfo.rating.value >= 3) {
      score += 5
      recommendations.push('Work on improving your review rating')
    } else {
      recommendations.push('Encourage satisfied customers to leave reviews')
    }

    // Photos
    maxScore += 4
    const photoCount = businessInfo.total_photos ?? 0
    if (photoCount >= 10) {
      score += 4
    } else if (photoCount >= 5) {
      score += 2
      recommendations.push('Add more photos to your profile')
    } else {
      recommendations.push('Add photos of your practice, team, and services')
    }

    // Normalize score to 0-100
    const normalizedScore = Math.round((score / maxScore) * 100)

    return {
      score: normalizedScore,
      missingFields,
      recommendations: recommendations.slice(0, 5),
    }
  }

  // ============================================================================
  // Task-Based API Methods (Posts, Q&A, Reviews)
  // ============================================================================

  /**
   * Submit a task to fetch Google Business Posts (Updates)
   * POST /v3/business_data/google/my_business_updates/task_post
   *
   * @param input - Task input with keyword/cid and location
   * @param options - Execution options
   * @returns Task ID for tracking
   *
   * @example
   * ```ts
   * const { taskId } = await business.submitPostsTask({
   *   keyword: 'cid:194604053573767737',
   *   locationCode: 2840,
   * });
   * // Poll getPostsTasksReady() then getPostsResults(taskId)
   * ```
   */
  async submitPostsTask(
    input: BusinessPostsTaskInput,
    options?: ExecuteOptions
  ): Promise<{ taskId: string }> {
    const validated = this.validateInput(businessPostsTaskInputSchema, input)

    const response = await this.execute(async () => {
      const request = new BusinessDataGoogleMyBusinessUpdatesTaskPostRequestInfo()
      request.keyword = validated.keyword
      request.language_code = validated.languageCode
      request.depth = validated.depth

      if (validated.locationCode) {
        request.location_code = validated.locationCode
      } else if (validated.locationName) {
        request.location_name = validated.locationName
      } else if (validated.locationCoordinate) {
        request.location_coordinate = validated.locationCoordinate
      } else {
        request.location_code = DEFAULT_LOCATION_CODE
      }

      if (validated.priority) {
        request.priority = parseInt(validated.priority, 10)
      }
      if (validated.tag) {
        request.tag = validated.tag
      }

      return this.client.business.googleMyBusinessUpdatesTaskPost([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    if (!task?.id) {
      throw new Error('Failed to submit posts task: no task ID returned')
    }

    return { taskId: task.id }
  }

  /**
   * Get list of completed Posts tasks ready for collection
   * GET /v3/business_data/google/my_business_updates/tasks_ready
   *
   * RATE LIMIT: 20 requests/minute
   */
  async getPostsTasksReady(options?: ExecuteOptions): Promise<BusinessTaskReady[]> {
    const response = await this.execute(
      () => this.client.business.googleMyBusinessUpdatesTasksReady(),
      options?.limiterType ?? 'tasksReady'
    )

    const tasks: BusinessTaskReady[] = []
    if (response?.tasks) {
      for (const task of response.tasks) {
        const taskResult = task as { result?: Array<{ id: string; tag?: string }> }
        if (taskResult?.result) {
          for (const item of taskResult.result) {
            tasks.push({ id: item.id, tag: item.tag ?? null })
          }
        }
      }
    }
    return tasks
  }

  /**
   * Get Posts results for a completed task
   * GET /v3/business_data/google/my_business_updates/task_get/{id}
   *
   * @param taskId - Task ID from submitPostsTask
   * @returns Posts result with items array
   */
  async getPostsResults(
    taskId: string,
    options?: ExecuteOptions
  ): Promise<BusinessPostsResult | null> {
    const cacheKey = CacheKeys.business.postsTask(taskId)

    const response = await this.executeWithCache(
      cacheKey,
      () => this.client.business.googleMyBusinessUpdatesTaskGet(taskId),
      {
        ...options,
        cache: { ttl: CacheTTL.GMB, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    const result = (task as { result?: unknown[] })?.result?.[0]
    if (!result) return null

    return result as unknown as BusinessPostsResult
  }

  /**
   * Submit a task to fetch Google Questions & Answers
   * POST /v3/business_data/google/questions_and_answers/task_post
   *
   * @param input - Task input with keyword/cid and location
   * @param options - Execution options
   * @returns Task ID for tracking
   *
   * @example
   * ```ts
   * const { taskId } = await business.submitQATask({
   *   keyword: 'cid:194604053573767737',
   *   locationCode: 2840,
   *   depth: 20, // 20 questions
   * });
   * ```
   */
  async submitQATask(
    input: BusinessQATaskInput,
    options?: ExecuteOptions
  ): Promise<{ taskId: string }> {
    const validated = this.validateInput(businessQATaskInputSchema, input)

    const response = await this.execute(async () => {
      const request = new BusinessDataGoogleQuestionsAndAnswersTaskPostRequestInfo()
      request.keyword = validated.keyword
      request.language_code = validated.languageCode
      request.depth = validated.depth

      if (validated.locationCode) {
        request.location_code = validated.locationCode
      } else if (validated.locationName) {
        request.location_name = validated.locationName
      } else if (validated.locationCoordinate) {
        request.location_coordinate = validated.locationCoordinate
      } else {
        request.location_code = DEFAULT_LOCATION_CODE
      }

      if (validated.priority) {
        request.priority = parseInt(validated.priority, 10)
      }
      if (validated.tag) {
        request.tag = validated.tag
      }

      return this.client.business.googleQuestionsAndAnswersTaskPost([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    if (!task?.id) {
      throw new Error('Failed to submit Q&A task: no task ID returned')
    }

    return { taskId: task.id }
  }

  /**
   * Get list of completed Q&A tasks ready for collection
   * GET /v3/business_data/google/questions_and_answers/tasks_ready
   *
   * RATE LIMIT: 20 requests/minute
   */
  async getQATasksReady(options?: ExecuteOptions): Promise<BusinessTaskReady[]> {
    const response = await this.execute(
      () => this.client.business.googleQuestionsAndAnswersTasksReady(),
      options?.limiterType ?? 'tasksReady'
    )

    const tasks: BusinessTaskReady[] = []
    if (response?.tasks) {
      for (const task of response.tasks) {
        const taskResult = task as { result?: Array<{ id: string; tag?: string }> }
        if (taskResult?.result) {
          for (const item of taskResult.result) {
            tasks.push({ id: item.id, tag: item.tag ?? null })
          }
        }
      }
    }
    return tasks
  }

  /**
   * Get Q&A results for a completed task
   * GET /v3/business_data/google/questions_and_answers/task_get/{id}
   *
   * @param taskId - Task ID from submitQATask
   * @returns Q&A result with questions and answers
   */
  async getQAResults(
    taskId: string,
    options?: ExecuteOptions
  ): Promise<BusinessQAResult | null> {
    const cacheKey = CacheKeys.business.qaTask(taskId)

    const response = await this.executeWithCache(
      cacheKey,
      () => this.client.business.googleQuestionsAndAnswersTaskGet(taskId),
      {
        ...options,
        cache: { ttl: CacheTTL.GMB, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    const result = (task as { result?: unknown[] })?.result?.[0]
    if (!result) return null

    return result as unknown as BusinessQAResult
  }

  /**
   * Submit a task to fetch Google Reviews
   * POST /v3/business_data/google/reviews/task_post
   *
   * @param input - Task input with keyword/cid and location
   * @param options - Execution options
   * @returns Task ID for tracking
   *
   * @example
   * ```ts
   * const { taskId } = await business.submitReviewsTask({
   *   keyword: 'cid:194604053573767737',
   *   locationCode: 2840,
   *   depth: 20, // 20 reviews
   *   sortBy: 'newest',
   * });
   * ```
   */
  async submitReviewsTask(
    input: BusinessReviewsTaskInput,
    options?: ExecuteOptions
  ): Promise<{ taskId: string }> {
    const validated = this.validateInput(businessReviewsTaskInputSchema, input)

    const response = await this.execute(async () => {
      const request = new BusinessDataGoogleReviewsTaskPostRequestInfo()
      request.keyword = validated.keyword
      request.language_code = validated.languageCode
      request.depth = validated.depth
      request.sort_by = validated.sortBy

      if (validated.locationCode) {
        request.location_code = validated.locationCode
      } else if (validated.locationName) {
        request.location_name = validated.locationName
      } else if (validated.locationCoordinate) {
        request.location_coordinate = validated.locationCoordinate
      } else {
        request.location_code = DEFAULT_LOCATION_CODE
      }

      if (validated.priority) {
        request.priority = parseInt(validated.priority, 10)
      }
      if (validated.tag) {
        request.tag = validated.tag
      }

      return this.client.business.googleReviewsTaskPost([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    if (!task?.id) {
      throw new Error('Failed to submit reviews task: no task ID returned')
    }

    return { taskId: task.id }
  }

  /**
   * Get list of completed Reviews tasks ready for collection
   * GET /v3/business_data/google/reviews/tasks_ready
   *
   * RATE LIMIT: 20 requests/minute
   */
  async getReviewsTasksReady(options?: ExecuteOptions): Promise<BusinessTaskReady[]> {
    const response = await this.execute(
      () => this.client.business.googleReviewsTasksReady(),
      options?.limiterType ?? 'tasksReady'
    )

    const tasks: BusinessTaskReady[] = []
    if (response?.tasks) {
      for (const task of response.tasks) {
        const taskResult = task as { result?: Array<{ id: string; tag?: string }> }
        if (taskResult?.result) {
          for (const item of taskResult.result) {
            tasks.push({ id: item.id, tag: item.tag ?? null })
          }
        }
      }
    }
    return tasks
  }

  /**
   * Get Reviews results for a completed task
   * GET /v3/business_data/google/reviews/task_get/{id}
   *
   * @param taskId - Task ID from submitReviewsTask
   * @returns Reviews result with items array
   */
  async getReviewsResults(
    taskId: string,
    options?: ExecuteOptions
  ): Promise<BusinessReviewsResult | null> {
    const cacheKey = CacheKeys.business.reviewsTask(taskId)

    const response = await this.executeWithCache(
      cacheKey,
      () => this.client.business.googleReviewsTaskGet(taskId),
      {
        ...options,
        cache: { ttl: CacheTTL.GMB, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    const result = (task as { result?: unknown[] })?.result?.[0]
    if (!result) return null

    return result as unknown as BusinessReviewsResult
  }

  /**
   * Helper: Wait for a specific task to be ready (with timeout)
   * Polls tasks_ready endpoint with exponential backoff
   *
   * @param taskId - Task ID to wait for
   * @param taskType - Type of task ('posts' | 'qa' | 'reviews')
   * @param maxWaitMs - Maximum wait time in milliseconds (default: 5 minutes)
   * @returns true if task is ready, false if timeout
   */
  async waitForTask(
    taskId: string,
    taskType: 'posts' | 'qa' | 'reviews',
    maxWaitMs: number = 5 * 60 * 1000
  ): Promise<boolean> {
    const startTime = Date.now()
    let pollInterval = 5000 // Start with 5 seconds
    const maxPollInterval = 30000 // Cap at 30 seconds

    const getTasksReady = async (): Promise<BusinessTaskReady[]> => {
      switch (taskType) {
        case 'posts':
          return this.getPostsTasksReady()
        case 'qa':
          return this.getQATasksReady()
        case 'reviews':
          return this.getReviewsTasksReady()
      }
    }

    while (Date.now() - startTime < maxWaitMs) {
      const readyTasks = await getTasksReady()
      if (readyTasks.some((t) => t.id === taskId)) {
        return true
      }

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      pollInterval = Math.min(pollInterval * 1.5, maxPollInterval)
    }

    return false
  }

  /**
   * High-level convenience method: Fetch posts for a business
   * Handles submit → poll → get flow automatically
   *
   * @param input - Business keyword/CID and options
   * @param maxWaitMs - Maximum wait time (default: 5 minutes)
   * @returns Posts result or null if timeout
   */
  async fetchBusinessPosts(
    input: BusinessPostsTaskInput,
    maxWaitMs: number = 5 * 60 * 1000
  ): Promise<BusinessPostsResult | null> {
    const { taskId } = await this.submitPostsTask(input)
    const isReady = await this.waitForTask(taskId, 'posts', maxWaitMs)
    if (!isReady) {
      console.warn(`Posts task ${taskId} timed out after ${maxWaitMs}ms`)
      return null
    }
    return this.getPostsResults(taskId)
  }

  /**
   * High-level convenience method: Fetch Q&A for a business
   * Handles submit → poll → get flow automatically
   *
   * @param input - Business keyword/CID and options
   * @param maxWaitMs - Maximum wait time (default: 5 minutes)
   * @returns Q&A result or null if timeout
   */
  async fetchBusinessQA(
    input: BusinessQATaskInput,
    maxWaitMs: number = 5 * 60 * 1000
  ): Promise<BusinessQAResult | null> {
    const { taskId } = await this.submitQATask(input)
    const isReady = await this.waitForTask(taskId, 'qa', maxWaitMs)
    if (!isReady) {
      console.warn(`Q&A task ${taskId} timed out after ${maxWaitMs}ms`)
      return null
    }
    return this.getQAResults(taskId)
  }

  /**
   * High-level convenience method: Fetch reviews for a business
   * Handles submit → poll → get flow automatically
   *
   * @param input - Business keyword/CID and options
   * @param maxWaitMs - Maximum wait time (default: 5 minutes)
   * @returns Reviews result or null if timeout
   */
  async fetchBusinessReviews(
    input: BusinessReviewsTaskInput,
    maxWaitMs: number = 5 * 60 * 1000
  ): Promise<BusinessReviewsResult | null> {
    const { taskId } = await this.submitReviewsTask(input)
    const isReady = await this.waitForTask(taskId, 'reviews', maxWaitMs)
    if (!isReady) {
      console.warn(`Reviews task ${taskId} timed out after ${maxWaitMs}ms`)
      return null
    }
    return this.getReviewsResults(taskId)
  }
}
