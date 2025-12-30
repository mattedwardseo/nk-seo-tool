# Project TODO List

## Current Status (Session 80) ✅ UI/UX + KEYWORD TRACKING ENHANCEMENTS

### Session 80: UI/UX Overhaul + Keyword Tracking Improvements (2025-12-18)

**Completed**:

1. ✅ **WCAG-Compliant Color Palette**
   - Updated `src/app/globals.css` with professional SEO tool colors
   - Primary blue: `#2563EB`, Background: `#F8F9FA`
   - Status colors: success (green), warning (amber), error (red), info (blue)
   - Each status has `-bg`, `-foreground`, `-border` variants
   - Ranking colors: `--rank-top3`, `--rank-top10`, `--rank-top20`
   - Full dark mode support with adjusted colors

2. ✅ **Dashboard Bug Fix**
   - File: `src/app/(dashboard)/d/[domainId]/page.tsx` line 119
   - Fixed: `campaignsData.data?.slice` → `campaignsData.data?.campaigns?.slice`

3. ✅ **Historical Keyword Data Lookback**
   - Added `getMostRecentVolume()` to `keyword-tracking-functions.ts`
   - Looks back through ALL historical months (not just most recent)
   - Finds first month with non-null, non-zero volume
   - Returns volume + date + CPC + KD

4. ✅ **New Database Columns**
   - `keyword_tracking_results.volume_date` - VARCHAR(7) "YYYY-MM"
   - `keyword_tracking_results.keyword_difficulty` - INT 0-100
   - Schema pushed to DB

5. ✅ **ResultsTable Redesign**
   - Removed SERP column (just showed count)
   - Added KD column with color-coded badges
   - Added volume date tooltip ("Data from Oct 2024")
   - Ranking URL shown on keyword hover
   - Uses TooltipProvider for all tooltips

6. ✅ **Position Badges CSS Variables**
   - `PositionBadge.tsx` updated to use CSS variables
   - `PositionChangeBadge.tsx` updated to use CSS variables
   - Consistent with theme, works in dark mode

**Build Status**: ✅ Passing

---

### Session 79: Phase 12.6 Unit Tests (2025-12-18)

**Completed**:
1. ✅ Domain Operations Unit Tests (18 tests)
2. ✅ Archive Operations Unit Tests (18 tests)
3. ✅ Archive API Route Tests (20 tests)

---

### Session 78: Route Cleanup & Phase 12.5 Archive UI (2025-12-18)

**Completed**:
1. ✅ Deleted 6 legacy route directories:
   - `src/app/(dashboard)/audits/` - replaced by `/d/[domainId]/audits/`
   - `src/app/(dashboard)/site-audit/` - replaced by `/d/[domainId]/site-audit/`
   - `src/app/(dashboard)/keyword-tracking/` - replaced by `/d/[domainId]/keyword-tracking/`
   - `src/app/(dashboard)/local-seo/` - replaced by `/d/[domainId]/local-seo/`
   - `src/app/(dashboard)/seo-audit/` - replaced by `/d/[domainId]/seo-audit/`
   - `src/app/(dashboard)/calculators/` - replaced by `/d/[domainId]/calculators/`

2. ✅ Phase 12.5: Archive UI & Migration
   - Created `src/lib/db/archive-operations.ts` - CRUD for unassigned/archived data
   - Created `src/app/api/archive/route.ts` - GET/POST for archive management
   - Created `src/app/(dashboard)/settings/archive/page.tsx` - Full archive UI with tabs
   - Updated `src/app/(dashboard)/settings/page.tsx` - Added archive card
   - Added `src/components/ui/checkbox.tsx` - shadcn checkbox component

**Archive Features**:
- Unassigned tab: View data without domain_id, assign to domain or archive
- Archived tab: View archived data (read-only), delete permanently
- Bulk selection with checkboxes
- Domain selector for assignment

**Phase 12 Status**: ✅ COMPLETE (All 6 phases done)

---

### Phase 16: Platform Redesign - URL-Based Domain Routing & UI/UX Overhaul (2025-12-17)

**Goal**: Transform platform architecture based on BrightLocal/SEMRush research patterns:
1. URL-based domain routing (`/d/[domainId]/audits` instead of query params) ✅ COMPLETE
2. Domain switcher moved to sidebar (BrightLocal pattern) ✅ COMPLETE (Sprint 2)
3. Section headers in sidebar (SEO TOOLS, LOCAL SEO, CALCULATORS) ✅ COMPLETE (Sprint 2)
4. Keyword tracking Local Pack column ✅ COMPLETE (Sprint 3)
5. High-quality UI/UX improvements 🔲 Ongoing

**Research Source**: Deep research document analyzing BrightLocal, SEMRush, and GoHighLevel patterns.

**User Decisions (Confirmed)**:
- Domain switcher → top of sidebar
- URL pattern → `/d/[domainId]/...`
- API routes → NOT moved (stay at `/api/...`, use query params for domain filtering)
- Landing page → Domain list grid with quick stats
- No intent badges in keyword tracking
- Yes to Local Pack column + position change indicators

---

### Sprint 1: URL Routing Refactor ✅ COMPLETE (Sessions 74-76)

**34 new page files created under `src/app/(dashboard)/d/[domainId]/`**

**Step 1.1: Create New Route Structure (Frontend)** ✅ COMPLETE

**Audits (4 pages)**
- [x] `d/[domainId]/audits/page.tsx` - Audits list
- [x] `d/[domainId]/audits/new/page.tsx` - New audit form
- [x] `d/[domainId]/audits/[id]/page.tsx` - Audit detail
- [x] `d/[domainId]/audits/[id]/competitors/page.tsx` - Competitor dashboard

**Site Audit (3 pages)**
- [x] `d/[domainId]/site-audit/page.tsx` - Scan list
- [x] `d/[domainId]/site-audit/new/page.tsx` - New scan form
- [x] `d/[domainId]/site-audit/[scanId]/page.tsx` - Scan detail with tabs

**Keyword Tracking (4 pages)**
- [x] `d/[domainId]/keyword-tracking/page.tsx` - Runs list
- [x] `d/[domainId]/keyword-tracking/new/page.tsx` - New run form
- [x] `d/[domainId]/keyword-tracking/schedule/page.tsx` - Schedule config
- [x] `d/[domainId]/keyword-tracking/[runId]/page.tsx` - Run detail with results

**Local SEO (8 pages)**
- [x] `d/[domainId]/local-seo/page.tsx` - Campaigns list
- [x] `d/[domainId]/local-seo/new/page.tsx` - New campaign form
- [x] `d/[domainId]/local-seo/[campaignId]/page.tsx` - Campaign dashboard
- [x] `d/[domainId]/local-seo/[campaignId]/grid/page.tsx` - Full-screen grid
- [x] `d/[domainId]/local-seo/[campaignId]/history/page.tsx` - Scan history
- [x] `d/[domainId]/local-seo/[campaignId]/competitors/page.tsx` - Competitors
- [x] `d/[domainId]/local-seo/[campaignId]/gbp/page.tsx` - GBP dashboard
- [x] `d/[domainId]/local-seo/[campaignId]/gbp-comparison/page.tsx` - GBP comparison

**SEO Audit (3 pages)**
- [x] `d/[domainId]/seo-audit/page.tsx` - Keyword audit list
- [x] `d/[domainId]/seo-audit/new/page.tsx` - New keyword audit
- [x] `d/[domainId]/seo-audit/[id]/page.tsx` - Audit detail

**Calculators (10 pages)**
- [x] `d/[domainId]/calculators/page.tsx` - Calculator hub
- [x] `d/[domainId]/calculators/seo/page.tsx` - SEO calc list
- [x] `d/[domainId]/calculators/seo/new/page.tsx` - New SEO calc
- [x] `d/[domainId]/calculators/seo/[id]/page.tsx` - SEO calc detail
- [x] `d/[domainId]/calculators/google-ads/page.tsx` - Google Ads calc list
- [x] `d/[domainId]/calculators/google-ads/new/page.tsx` - New Google Ads calc
- [x] `d/[domainId]/calculators/google-ads/[id]/page.tsx` - Google Ads calc detail
- [x] `d/[domainId]/calculators/capacity/page.tsx` - Capacity calc list
- [x] `d/[domainId]/calculators/capacity/new/page.tsx` - New Capacity calc
- [x] `d/[domainId]/calculators/capacity/[id]/page.tsx` - Capacity calc detail

**Infrastructure (2 pages)**
- [x] `d/[domainId]/layout.tsx` - Domain validation wrapper
- [x] `d/[domainId]/page.tsx` - Domain dashboard

**Step 1.2: Update Components** ✅ COMPLETE

**Components with `basePath` prop (7 total)**
- [x] `AuditTable.tsx` - Audit list table
- [x] `ScanCard.tsx` - Site audit scan card
- [x] `RunCard.tsx` - Keyword tracking run card
- [x] `ScheduleCard.tsx` - Keyword tracking schedule card
- [x] `CampaignCard.tsx` - Local SEO campaign card
- [x] `KeywordAuditList.tsx` - SEO audit list
- [x] `CalculatorCard.tsx` - Calculator card

**Other component updates**
- [x] `Sidebar.tsx` - `getNavItems(domainId)` function for domain-scoped links
- [x] `Breadcrumbs.tsx` - Parse `/d/[domainId]/` pattern, show domain name
- [x] `DomainListCard.tsx` - NEW component for landing grid
- [x] Landing page (`page.tsx`) - Domain list grid

**Step 1.3: API Route Structure** 🔲 DEFERRED
- Decision: API routes stay at existing paths (e.g., `/api/audits?domainId=...`)
- Domain filtering via query parameter in API calls
- No need to move APIs since frontend handles domain context

**Step 1.4: Migration** ✅ COMPLETE
- [x] Redirect middleware for old URLs with `?domainId=` param
- [x] Build passes with all new routes registered
- [ ] Delete old route files (optional cleanup - keep for backwards compatibility)

---

### Sprint 2: Navigation & Colors ✅ COMPLETE (Session 77)

**Step 2.1: Domain Selector in Sidebar** ✅
- [x] Move `DomainSelector` from Header to Sidebar top
- [x] Add search functionality (shadcn Command component)
- [x] Remove DomainSelector from Header
- [ ] Add "Pinned" domains section (optional future enhancement)
- [ ] Add "Recent" domains section (optional future enhancement)

**Step 2.2: Section Headers** ✅
- [x] Add section headers: "SEO TOOLS", "LOCAL SEO", "CALCULATORS"
- [x] Section headers styled as 11px uppercase with letter-spacing
- [x] Dashboard and Settings standalone (no section header)

**Files Modified**:
- `src/components/layout/Sidebar.tsx` - Major refactor with `getNavSections()`, domain selector, section headers
- `src/components/layout/Header.tsx` - Removed DomainSelector import

---

### Sprint 3: Keyword Tracking Local Pack ✅ COMPLETE (Session 77)

**Database Schema Changes** ✅:
```prisma
model keyword_tracking_results {
  // ... existing fields
  local_pack_position   Int?          // Position in local pack (1-3)
  local_pack_rating     Decimal?      // Star rating (1.0-5.0)
  local_pack_reviews    Int?          // Number of reviews
  local_pack_cid        String?       // GBP CID
}
```

**Backend Changes** ✅:
- [x] Add fields to Prisma schema (`local_pack_position`, `local_pack_rating`, `local_pack_reviews`, `local_pack_cid`)
- [x] Run migration (`prisma db push`)
- [x] Update `competitor-analysis.ts` with `LocalPackResult` interface and extraction logic
- [x] Update `keyword-tracking-functions.ts` to pass local pack data through
- [x] Update `keyword-tracking-operations.ts` types and save/get operations
- [x] API returns local pack fields automatically (via operations layer)

**Frontend Changes** ✅:
- [x] Add Local Pack column to `ResultsTable.tsx`
- [x] Inline badge display with MapPin icon and star rating
- [x] Shows "#1 ★4.8" format when in local pack
- [x] Shows "Not in pack" if SERP has local_pack but client isn't in it
- [x] Shows "—" if no local pack on SERP

**Files Modified**:
- `prisma/schema.prisma` - Added 4 local pack fields
- `src/lib/competitors/competitor-analysis.ts` - `LocalPackResult` interface, extraction logic
- `src/lib/inngest/keyword-tracking-functions.ts` - Pass local pack data through
- `src/lib/db/keyword-tracking-operations.ts` - Updated types and operations
- `src/components/keyword-tracking/ResultsTable.tsx` - Added Local Pack column

---

### Files Created in Phase 16 (Sprint 1)

| File | Description |
|------|-------------|
| `src/app/(dashboard)/d/[domainId]/layout.tsx` | Domain validation layout |
| `src/app/(dashboard)/d/[domainId]/page.tsx` | Domain dashboard |
| `src/app/(dashboard)/d/[domainId]/audits/page.tsx` | Audits list |
| `src/app/(dashboard)/d/[domainId]/audits/[id]/page.tsx` | Audit detail |
| `src/components/domains/DomainListCard.tsx` | Domain card for landing grid |

### Files Modified This Session

| File | Changes |
|------|---------|
| `src/components/layout/Sidebar.tsx` | `getNavItems()` function for domain-scoped links |
| `src/components/audit/AuditTable.tsx` | Added `basePath` prop |
| `src/app/(dashboard)/page.tsx` | Domain list grid |
| `src/components/domains/index.ts` | Added DomainListCard export |

---

## Previous Phase Status

### Phase 15: Keyword Tracking Tool ✅ COMPLETE (2025-12-17)

**Goal**: Standalone domain-scoped keyword rank tracking with SERP position monitoring, position change tracking, and scheduled automation.

**Database Schema** (`prisma/schema.prisma:901-1006`):
- ✅ `keyword_tracking_runs` - Parent run records with status, metrics, cost tracking
- ✅ `keyword_tracking_results` - Per-keyword results (position, volume, CPC, SERP features)
- ✅ `keyword_tracking_schedules` - Automated scheduling (weekly/biweekly/monthly)
- ✅ `KeywordTrackingRunStatus` enum (PENDING, RUNNING, COMPLETED, FAILED)

**Core Infrastructure**:
- ✅ `src/lib/db/keyword-tracking-operations.ts` - Full CRUD (889 lines)
- ✅ `src/lib/inngest/keyword-tracking-functions.ts` - Background orchestration (492 lines)
- ✅ Inngest event schemas in `src/lib/inngest.ts` (lines 137-172)
- ✅ Registered in `src/app/api/inngest/route.ts`

**API Routes** (`src/app/api/keyword-tracking/`):
- ✅ `route.ts` - POST (create run), GET (list runs)
- ✅ `schedule/route.ts` - GET/POST/PATCH/DELETE schedules
- ✅ `runs/[runId]/route.ts` - GET (detail), DELETE
- ✅ `runs/[runId]/status/route.ts` - GET (polling)
- ✅ `runs/[runId]/results/route.ts` - GET (paginated, filtered)

**UI Components** (`src/components/keyword-tracking/`):
- ✅ RunCard, RunOverview, RunProgress, ResultsTable
- ✅ ResultFilters, PositionBadge, PositionChangeBadge
- ✅ ScheduleCard, ScheduleForm
- ✅ `index.ts` barrel exports

**Dashboard Pages** (`src/app/(dashboard)/keyword-tracking/`):
- ✅ `page.tsx` - List view with runs + schedule sidebar
- ✅ `new/page.tsx` - Start new tracking run
- ✅ `[runId]/page.tsx` - Run detail with Overview + Keywords tabs
- ✅ `schedule/page.tsx` - Schedule configuration

**Navigation**:
- ✅ Sidebar menu item "Keyword Tracking" with sub-items

**Key Features**:
1. Real-time SERP position tracking via DataForSEO
2. Historical API fallback for dental+city keywords (Google Ads blocked)
3. Position change tracking (improved/declined/unchanged/new/lost)
4. Scheduled automation (weekly/biweekly/monthly)
5. Filtering: position buckets + change types
6. Progress polling with real-time updates

---

### Phase 13: Domain-Scoped Calculators ✅ COMPLETE (2025-12-12)

**Goal**: Transform from tool-integrated ROI calculations to 3 standalone domain-scoped calculators.

**All 3 Calculators Complete**:
- ✅ **SEO Calculator** - Organic + Local Maps search ROI projections (completed in previous session)
- ✅ **Google Ads Calculator** - Paid search ROI projections with mgmt fee breakdown
- ✅ **Capacity Calculator** - Practice capacity utilization and revenue gap analysis

**Session 71 Work**:
1. ✅ Fixed build errors from previous session (ZodError `.errors` → `.issues`, unused imports)
2. ✅ Built Google Ads Calculator (library, API, UI)
3. ✅ Built Capacity Calculator (library, API, UI)
4. ✅ Updated calculators hub page (removed disabled/comingSoon flags)
5. ✅ All builds passing

### Phase 12 Progress: 5 of 6 phases complete

**Completed Phases**:
- ✅ **Phase 1: Database Schema** - Prisma models, seed script, 3 test domains
- ✅ **Phase 2: Domain Context & API** - DomainContext, DomainSelector, 8 API endpoints
- ✅ **Phase 3: Navigation & Filtering** - Sidebar badges, breadcrumbs, dashboard cards, tool page filtering
- ✅ **Phase 4: ROI Calculator Tool** - List page, creation form, detail view, 2 API routes
- ✅ **Phase 5: Data Migration & Archive** - Archive UI at /settings/archive, archive operations (Session 78)

**Remaining Phases**:
- 🔲 **Phase 6: Polish & Testing** - E2E tests, feature flag rollout (optional)

---

### Previous Sessions

**Session 68: Competitor Dashboard Demo Enhancements** ✅ COMPLETE (2025-12-10)

**Goal**: Add visual polish for 2-hour boss demo - answer "How do I compare to competitors?"

**What Was Built**:
1. ✅ **ExecutiveSummaryCard** - At-a-glance competitive position (#X of Y, traffic gap, W/L, opportunity $)
2. ✅ **Visual Ranking Bar Chart** - Recharts horizontal bars showing You vs Best Competitor
3. ✅ **LLM Mentions Enhancement** - Real benchmark data showing industry leaders (Reddit, Healthline, etc.)
4. ✅ **LLMMentionsCard UI** - Headline insight banner + industry leaders section

**Key Insight**: Local dental practices have 0 AI mentions - this is the opportunity story for sales.

**Files Created**:
- `src/components/competitors/ExecutiveSummaryCard.tsx`

**Files Modified**:
- `src/components/competitors/index.ts`
- `src/components/competitors/CompetitorDashboard.tsx`
- `src/components/competitors/RankingComparison.tsx`
- `src/app/api/audits/[id]/competitors/llm-mentions/route.ts`
- `src/components/competitors/LLMMentionsCard.tsx`

**Verification**: ✅ Build passes

---

**Session 67: GBP Comparison Data Flow Fix** ✅ COMPLETE (2025-12-10)

**Goal**: Fix bug where Posts and Q&A tabs showed "No data available" even after fetching detailed data.

**Problem Found**: `GBPComparisonDashboard.tsx` was passing hardcoded `null` values to `PostsComparisonCard` and `QAComparisonCard` instead of using the actual fetched data from the `gbp_detailed_profiles` database table.

**Fix Applied**:
1. ✅ Updated `/api/local-seo/campaigns/[id]/gbp-comparison/route.ts`:
   - Added import for `getGBPDetailedProfilesForCampaign`
   - Added step 7 to fetch detailed profiles from database
   - Response now includes `detailedData` with posts/Q&A info for target and competitors

2. ✅ Updated `GBPComparisonDashboard.tsx`:
   - Added `DetailedPostsData` and `DetailedQAData` interfaces
   - Updated `GBPComparisonData` interface to include optional `detailedData`
   - Modified Posts and Q&A tab content to use `data.detailedData` when available
   - Falls back to null values if detailed data not yet fetched

**Data Flow (Now Working)**:
```
FetchDetailedDataButton (POST) → gbp_detailed_profiles table
                                        ↓
Main GBP Comparison API (GET) → includes detailedData in response
                                        ↓
GBPComparisonDashboard → passes to PostsComparisonCard, QAComparisonCard
```

**Files Modified**:
- `src/app/api/local-seo/campaigns/[id]/gbp-comparison/route.ts`
- `src/components/local-seo/gbp-comparison/GBPComparisonDashboard.tsx`
- `CLAUDE.md` (documentation updated)

**Verification**:
- ✅ Build passes
- ✅ All components properly wired

---

**Session 66: Enhanced GBP Comparison - Posts & Q&A** ✅ COMPLETE (Sprint 1)

**Goal**: Replace "Manual Checks" with actual data - fetch Posts, Q&A, Reviews from DataForSEO Business Data API using task-based pattern.

**What Was Built**:

1. **BusinessModule Task-Based Methods** (`src/lib/dataforseo/modules/business.ts`)
   - [x] `submitPostsTask()`, `getPostsTasksReady()`, `getPostsResults()`, `fetchBusinessPosts()`
   - [x] `submitQATask()`, `getQATasksReady()`, `getQAResults()`, `fetchBusinessQA()`
   - [x] `submitReviewsTask()`, `getReviewsTasksReady()`, `getReviewsResults()`, `fetchBusinessReviews()`
   - [x] `waitForTask()` helper with polling logic

2. **Zod Schemas** (`src/lib/dataforseo/schemas/business.ts`)
   - [x] `businessPostsTaskInputSchema`, `businessQATaskInputSchema`, `businessReviewsTaskInputSchema`
   - [x] `businessTaskReadySchema`, `businessPostItemSchema`, `businessQuestionItemSchema`
   - [x] `businessPostsResultSchema`, `businessQAResultSchema`, `businessReviewsResultSchema`

3. **Cache Keys** (`src/lib/dataforseo/cache/cache-keys.ts`)
   - [x] `business.posts`, `business.qa`, `business.reviewsTask`, `business.postsTask`, `business.qaTask`

4. **Database Schema** (`prisma/schema.prisma`)
   - [x] Added `gbp_detailed_profiles` table with 30+ fields for Posts, Q&A, Reviews, Services, Products

5. **Database Operations** (`src/lib/db/gbp-detailed-operations.ts`) - NEW FILE
   - [x] `upsertGBPDetailedProfile()`, `updateGBPPostsData()`, `updateGBPQAData()`, `updateGBPReviewsData()`
   - [x] `getGBPDetailedProfile()`, `getGBPDetailedProfilesForCampaign()`, `hasDetailedData()`

6. **API Endpoint** (`src/app/api/local-seo/campaigns/[id]/gbp-comparison/fetch-detailed/route.ts`) - NEW
   - [x] POST - Trigger fetch of Posts, Q&A, Reviews for target + competitors
   - [x] GET - Return status of what data exists and when last fetched

7. **UI Components** (`src/components/local-seo/gbp-comparison/`)
   - [x] `FetchDetailedDataButton.tsx` - Manual trigger with status display
   - [x] `PostsComparisonCard.tsx` - Posts count, frequency, last post, activity level
   - [x] `QAComparisonCard.tsx` - Questions count, answer rate, unanswered alerts

8. **Dashboard Integration** (`GBPComparisonDashboard.tsx`)
   - [x] Added 6 tabs (Overview, Comparison, Gaps, Posts, Q&A, By Keyword)
   - [x] Added FetchDetailedDataButton to Overview tab

**Key Technical Details**:
- Task-based API pattern: POST task → Poll tasks_ready → GET results
- Rate limiting: 'tasksReady' limiter (20 req/min)
- Prisma JSON null handling: Use `Prisma.JsonNull` for null JSON fields
- 4-hour cache TTL for GBP data
- Cost: ~$0.02 per full comparison (1 target + 3 competitors)

---

**Session 64: Phase 11 - Competitor Comparison Dashboard** ✅ COMPLETE

**Goal**: Build competitor comparison dashboard with ROI projections and dollar values.

**Phase 11.1: Database + Intake** ✅ COMPLETE
- [x] Add 4 fields to Prisma schema: operatories, days_open, target_new_patients, avg_patient_value
- [x] Run `npx prisma db push` to sync schema
- [x] Update NewAuditForm with Practice Operations UI section
- [x] Update Zod schema with field validation
- [x] Update API route `/api/audits` to accept new fields
- [x] Update `audit-operations.ts` to save new fields

**Phase 11.2: ROI Calculator** ✅ COMPLETE
- [x] Create `src/lib/competitors/roi-calculator.ts`
- [x] Implement `calculateROIProjection()` with good/avg/bad scenarios
- [x] CTR by position lookup table
- [x] Patient value calculations

**Phase 11.3: Competitor API Routes** ✅ COMPLETE
- [x] `src/app/api/audits/[id]/competitors/route.ts` - GET full competitor data
- [x] `src/app/api/audits/[id]/competitors/serp-comparison/route.ts` - Side-by-side rankings
- [x] `src/app/api/audits/[id]/competitors/backlink-gap/route.ts` - Link opportunities
- [x] `src/app/api/audits/[id]/competitors/llm-mentions/route.ts` - AI visibility
- [x] `src/app/api/audits/[id]/competitors/roi-projection/route.ts` - ROI calculations

**Phase 11.4: UI Components** ✅ COMPLETE
- [x] `src/components/competitors/CompetitorDashboard.tsx`
- [x] `src/components/competitors/RankingComparison.tsx`
- [x] `src/components/competitors/ROICalculator.tsx`
- [x] `src/components/competitors/BacklinkGapCard.tsx`
- [x] `src/components/competitors/LLMMentionsCard.tsx`
- [x] `src/components/competitors/MarketShareChart.tsx`
- [x] `src/components/competitors/CompetitorSelector.tsx`
- [x] `src/components/competitors/index.ts`

**Phase 11.5: Dashboard Page** ✅ COMPLETE
- [x] `src/app/(dashboard)/audits/[id]/competitors/page.tsx`
- [x] Competitors accessed via audit detail page (per-audit, not global)

**Phase 11.6: Testing & Bug Fixes** ✅ COMPLETE
- [x] Test with real audit data (fielderparkdental.com)
- [x] Verify MCP integration works
- [x] Fixed CUID2 validation bug (was using CUID1 validator)
- [x] Dashboard loads and displays all competitor data

---

### Recently Completed

**Session 64: Phase 11 Verification & Bug Fixes** ✅ COMPLETE
- Verified Phase 11 was already fully implemented (TODO.md was out of sync)
- Fixed CUID2 validation bug in 3 API routes (`/api/audits/[id]/*`)
- Tested competitor dashboard with live audit data
- All features working: ROI Calculator, Rankings, Backlinks, Market Share

**Session 63: Site Audit Enhanced Issue Display** ✅ COMPLETE
- Fixed critical bug: issue counts were hardcoded to 0
- Added `calculateIssueCounts()` using `ISSUE_SEVERITY_CONFIG`
- Database: Added `redirect_location`, `is_redirect`, `duplicate_content` fields
- 5 new query methods for duplicates, redirects, non-indexable pages
- 4 new API routes for issue exploration
- 5 new UI components (IssueExplorerTabs, DuplicatesTable, RedirectsTable, NonIndexableTable)
- Fixed PageDetailDrawer to fetch real data + proper check semantics (NEGATIVE_CHECKS pattern)
- Added URL sorting to pages table
- Fixed Prisma Decimal to Number conversion

**Session 62: API Response snake_case Fix** ✅ COMPLETE
- Fixed runtime TypeError on audit detail page
- Changed `step_results` → `stepResults` in API responses

**Session 60-61: Site Audit Feature** ✅ COMPLETE
- Full site crawl with DataForSEO OnPage Task API
- Inngest orchestrator with polling + exponential backoff
- 8 UI components, 7 API routes, 4 dashboard pages

---

## Phase 1: Foundation ✅ COMPLETE

- [x] Initialize Next.js 16 project
- [x] Configure TypeScript strict mode
- [x] Set up Prisma ORM
- [x] Create database schema (User, Audit, AuditMetric)
- [x] Apply migrations (two-phase approach)
- [x] Create hypertable for audit_metrics
- [x] Set up Prisma client singleton
- [x] Create health check API
- [x] Deploy to Vercel
- [x] Create context management files
- [x] Install and configure Inngest (Vercel integration)
- [x] Install and configure Sentry (Vercel integration)
- [x] Set up testing framework (vitest, testing-library)
- [x] Configure Prettier with Tailwind plugin
- [x] Create .cursorrules for AI-assisted development
- [x] Create utility functions (src/lib/utils.ts)
- [x] Create SEO type definitions (src/types/seo.ts)
- [x] Create .env.example template
- [x] Configure DataForSEO MCP (.mcp.json)

## Phase 2: API Integration ✅ COMPLETE

### Step 1: Core Infrastructure ✅
- [x] Install dataforseo-client and bottleneck packages
- [x] Create DataForSEO client wrapper (src/lib/dataforseo/client.ts)
- [x] Implement Bottleneck rate limiter (src/lib/dataforseo/rate-limiter.ts)
- [x] Create type definitions (src/lib/dataforseo/types.ts)
- [x] Create module exports (src/lib/dataforseo/index.ts)

### Step 2: Caching Layer ✅
- [x] Install @upstash/redis package
- [x] Create Redis cache manager (src/lib/dataforseo/cache/redis-cache.ts)
- [x] Create cache key utilities (src/lib/dataforseo/cache/cache-keys.ts)
- [x] Update .env.example with Upstash config
- [x] Add Upstash credentials to .env.local ✅ (2025-11-25)

### Step 3: Zod Validation Schemas ✅
- [x] Create common schemas (src/lib/dataforseo/schemas/common.ts)
- [x] Create OnPage schemas (src/lib/dataforseo/schemas/onpage.ts)
- [x] Create SERP schemas (src/lib/dataforseo/schemas/serp.ts)
- [x] Create Backlinks schemas (src/lib/dataforseo/schemas/backlinks.ts)
- [x] Create Keywords schemas (src/lib/dataforseo/schemas/keywords.ts)
- [x] Create Labs schemas (src/lib/dataforseo/schemas/labs.ts)
- [x] Create Business schemas (src/lib/dataforseo/schemas/business.ts)

### Step 4: API Module Wrappers ✅
- [x] Create base module class (src/lib/dataforseo/modules/base-module.ts)
- [x] Create OnPage module (src/lib/dataforseo/modules/onpage.ts)
- [x] Create SERP module (src/lib/dataforseo/modules/serp.ts)
- [x] Create Backlinks module (src/lib/dataforseo/modules/backlinks.ts)
- [x] Create Keywords module (src/lib/dataforseo/modules/keywords.ts)
- [x] Create Labs module (src/lib/dataforseo/modules/labs.ts)
- [x] Create Business module (src/lib/dataforseo/modules/business.ts)
- [x] Update barrel exports (src/lib/dataforseo/index.ts)

### Step 5: Testing ✅ COMPLETE
- [x] All 228 tests passing

## Phase 3: Background Jobs & Audit Engine ✅ COMPLETE

### Step 3.1: Core Infrastructure ✅ COMPLETE
- [x] Define audit event types (src/types/audit.ts)
- [x] Define audit status enum in Prisma schema
- [x] Add progress/score fields to Audit model
- [x] Apply database migrations (SQL for enum + columns)
- [x] Create audit database operations (src/lib/db/audit-operations.ts)

### Step 3.2: Inngest Functions ✅ COMPLETE
- [x] Create Inngest client with typed events (src/lib/inngest.ts)
- [x] Create main audit orchestrator function (src/lib/inngest/audit-functions.ts)
- [x] Implement OnPage crawl step
- [x] Implement SERP analysis step
- [x] Implement backlinks analysis step
- [x] Implement GMB/business data step
- [x] Register functions in route handler

### Step 3.3: Scoring Engine ❌ REMOVED (2025-12-04)
~~Custom scoring module was removed as part of UI cleanup.~~
- Deleted: `src/lib/scoring/` entire directory
- Deleted: Score display components (ScoreGauge, ScoreCard, ScoreBadge, ExecutiveSummary, RecommendationsList)
- Removed: Score columns from database schema
- Now showing only raw DataForSEO API data (onpage_score, rank, etc.)

### Step 3.4: Progress Tracking ✅ COMPLETE
- [x] Create GET /api/audits/[id]/status endpoint
- [x] Implement progress updates in orchestrator

### Step 3.5: Error Handling & Retries ✅ COMPLETE
- [x] Configure Inngest retry policy (3 retries with auto exponential backoff)
- [x] Handle DataForSEO error codes (via existing classifyError utility)
- [x] Create audit failure handler (with error category tracking)
- [x] Implement independent step execution (steps fail independently)

### Step 3.6: API Routes ✅ COMPLETE
- [x] Create POST /api/audits endpoint (trigger new audit)
- [x] Create GET /api/audits endpoint (list user audits)
- [x] Create GET /api/audits/[id] endpoint (full audit details)
- [x] Create DELETE /api/audits/[id] endpoint (delete audit)
- [x] Create GET /api/audits/[id]/status endpoint (progress polling)
- [x] Create POST /api/audits/[id]/retry endpoint (retry failed audit)

### Step 3.7: Testing ✅ COMPLETE
- [x] Write unit tests for scoring engine (34 tests in engine.test.ts)
- [x] Write integration tests for audit flow (44 tests across 4 files)

## Phase 4: Dashboard UI ✅ COMPLETE

**Build Status**: ✅ Build passes (2025-11-27)
**Test Status**: ✅ **774 tests passing**
**Accessibility**: ✅ **100/100 Lighthouse score on all pages** (2025-11-27)

### Step 4.1: Core Infrastructure ✅ COMPLETE
- [x] Install shadcn/ui components (17+ components including slider, tooltip)
- [x] Create DashboardLayout with responsive sidebar
- [x] Create Header component with theme toggle
- [x] Implement ThemeProvider (light/dark mode)
- [x] Install Tremor (@tremor/react) for charts
- [x] Install Recharts for data visualization
- [x] Install jspdf + jspdf-autotable for PDF export

### Step 4.2: Pages ✅ COMPLETE
- [x] Create dashboard home page
- [x] Create audits list page with TanStack React Table
- [x] Create new audit page with domain form
- [x] Create audit detail page with results display

### Step 4.3: Audit Components ✅ COMPLETE
- [x] AuditStatusBadge (6 statuses with icons)
- [x] ScoreBadge (score + grade display)
- [x] ScoreCard (large dashboard cards)
- [x] ScoreOverview (5-card layout)
- [x] AuditProgress (real-time polling)
- [x] AuditTable (sortable, paginated)
- [x] AuditFilters (search + status dropdown)
- [x] CategoryBreakdown (tabbed metrics)
- [x] RecommendationsList (priority-sorted)
- [x] NewAuditForm (domain validation)

### Step 4.4: Charts & Visualizations ✅ COMPLETE (2025-11-26)
- [x] Create ScoreGauge.tsx (radial gauge component) - `src/components/audit/ScoreGauge.tsx`
- [x] Create MetricChart.tsx (Tremor chart wrapper) - `src/components/charts/MetricChart.tsx`
- [x] Create Sparkline.tsx (inline mini charts) - `src/components/charts/Sparkline.tsx`
- [x] Create TrendIndicator.tsx (▲▼ arrows with delta) - `src/components/audit/TrendIndicator.tsx`
- [x] Create charts/index.ts barrel export - `src/components/charts/index.ts`
- [x] Update ScoreCard with ScoreCardWithGauge variant - `src/components/audit/ScoreCard.tsx`

### Step 4.5: Competitor & Keyword Components ✅ COMPLETE (2025-11-26)
- [x] CompetitorComparison.tsx - Side-by-side competitor table with metric bars
- [x] CompetitorRadar.tsx - Spider/radar chart for multi-metric comparison
- [x] BacklinkGap.tsx - Link gap analysis with opportunity finder
- [x] KeywordTable.tsx - Full keyword tracking with filters, sorting, SERP features
- [x] SerpFeatureIcons.tsx - SERP feature indicators (featured snippet, local pack, etc.)
- [x] PositionDistribution.tsx - Stacked bar chart for position buckets (1-3, 4-10, etc.)

### Step 4.6: GBP & Local SEO Components ✅ COMPLETE (2025-11-26)
- [x] GBPCompleteness.tsx - Profile completeness meter with field-by-field breakdown
- [x] ReviewSentiment.tsx - Review analysis with sentiment breakdown (positive/negative/neutral)
- [x] CitationConsistency.tsx - NAP validation display with consistency scoring

### Step 4.7: Sales-Focused Components ✅ COMPLETE (2025-11-26)
- [x] ROICalculator.tsx - Interactive ROI projection with sliders (investment, timeline)
- [x] ExecutiveSummary.tsx - Above-fold impact display with scores, issues, and highlights

### Step 4.8: UX Polish ✅ COMPLETE (2025-11-27)
- [x] All components include skeleton loading states
- [x] Create /api/dashboard/stats endpoint
- [x] Update dashboard home with real API stats
- [x] Run Lighthouse audit - **100/100 on all pages**
- [x] Manual WCAG AA check - Focus states, contrast, keyboard nav verified

### Step 4.9: Testing ✅ COMPLETE
- [x] Write tests for Score components (ScoreCard, ScoreGauge, ScoreBadge, TrendIndicator) - **99 tests passing**
- [x] Write tests for AuditStatusBadge - **15 tests passing**
- [x] Write tests for AuditFilters - **15 tests passing**
- [x] Write tests for CategoryBreakdown - **29 tests passing**
- [x] Write tests for AuditProgress - **11 tests passing** (fixed with pollInterval prop 2025-11-27)
- [x] Write tests for AuditTable - **~35 tests passing** (created 2025-11-27)
- [x] Write tests for KeywordTable - **~35 tests passing** (created 2025-11-27)
- [x] Write tests for RecommendationsList - **~30 tests passing** (created 2025-11-27, fixed grade expectations)
- [x] Write tests for Local SEO (GBPCompleteness, ReviewSentiment, CitationConsistency) - **80 tests passing** (Session 23)
- [x] Write tests for Competitor/Backlink (CompetitorComparison, CompetitorRadar, BacklinkGap) - **54 tests passing** (Session 23)
- [x] Write tests for Sales/Executive components (ROICalculator, ExecutiveSummary) - **49 tests passing** (Session 24 - fixed Slider mock issues)
- [ ] Write tests for remaining utility components (NewAuditForm, SerpFeatureIcons, PositionDistribution) - Optional
- [ ] Write tests for Chart components (MetricChart, Sparkline) - Optional

### Step 4.10: Advanced Features (Optional/Future)
- [ ] Implement audit scheduling UI
- [ ] Add PDF export functionality (jspdf installed)
- [ ] Add sparklines to AuditTable

## Phase 4.7: Enhanced SERP Data with Labs API ❌ PARTIALLY DELETED (Session 46)

**Note (2025-12-04)**: User requested simplification - removed all keyword position tracking metrics.
Many components from this phase were deleted during Keywords Tab Simplification (Session 46).

**What Was Kept**:
- KeywordTable with rich data columns (position, volume, CPC, competition, bids)
- Historical keyword enrichment with clock icons for dated data
- Labs API integration for discovery keywords
- `discoveryKeywords` and `trackedKeywords` arrays in SerpStepResult

**What Was Deleted**:
- ❌ `KeywordsByIntent.tsx` - Intent distribution pie chart
- ❌ `SerpFeaturesSummaryCard.tsx` - SERP feature icons grid
- ❌ `KeywordMovementCard.tsx` - Up/down/stable/new keyword cards
- ❌ `PositionDistribution.tsx` - Position bucket bar chart
- ❌ `KeywordMovement` and `PositionDistribution` types
- ❌ Position tracking metrics (keywordsTracked, avgPosition, top3Count, top10Count)
- ❌ Backend calculation logic for position distribution and movement

See Session 46 in PROGRESS.md for full details.

---

## Phase 4.6: Wire Up Unused Components (Updated 2025-12-04)

**Status**: Updated after scoring removal (Session 45) and keywords simplification (Session 46).

**Components Currently In Use**:
- KeywordTable ✅ (Keywords tab - simplified)
- GBPCompleteness ✅ (Local SEO tab)
- ReviewSentiment ✅ (Local SEO tab)
- CategoryBreakdown ✅ (Technical tab)
- AuditProgress ✅ (In-progress audits)
- AuditStatusBadge ✅
- CompetitorComparison ✅ (Competitors tab)

**Components DELETED**:
- ❌ ExecutiveSummary - Removed with scoring (Session 45)
- ❌ PositionDistribution - Removed with keywords simplification (Session 46)
- ❌ KeywordMovementCard - Removed with keywords simplification (Session 46)
- ❌ RecommendationsList - Removed with scoring (Session 45)
- ❌ ScoreGauge, ScoreCard, ScoreBadge - Removed with scoring (Session 45)

**Components NOT yet used (optional enhancements)**:
- BacklinkGap, CitationConsistency, CompetitorRadar
- ROICalculator, TrendIndicator

---

## Phase 4.5: Live Integration Testing ✅ COMPLETE

**Goal**: Verify all APIs, Inngest jobs, and UI components work with real DataForSEO data.

### Test Domain
- **Use**: `southshoredentistry.com` (verified working with DataForSEO)
- **Avoid**: `dentistsofarlington.com` (blocked by Varnish CDN - returns 403)

### Pre-Test Setup
1. Restart dev server: `npm run dev`
2. Restart Inngest: `npx inngest-cli@latest dev`
3. Verify health: `http://localhost:3000/api/health`
4. Verify Inngest: `http://localhost:8288`

### Stage 1: Infrastructure Health ✅ COMPLETE
- [x] Health endpoint returns healthy
- [x] Database connected with TimescaleDB 2.17.1
- [x] Inngest dashboard accessible with functions registered
- [x] Dashboard stats API working

### Stage 2: DataForSEO API Verification ✅ COMPLETE
- [x] OnPage module - returns rich data (onpage_score: 95.24)
- [x] Backlinks module - returns rank (143), backlinks (422), spam score (7)
- [x] Business module - returns GMB data (4.9 stars, 893 reviews)
- [ ] SERP module - not yet tested directly
- [ ] Keywords module - not yet tested directly

### Stage 3: Full E2E Audit Test 🚧 IN PROGRESS
- [x] Fixed userId validation (changed from CUID to string)
- [ ] Trigger audit via UI at /audits/new
- [ ] Watch Inngest steps execute
- [ ] Verify scores calculated
- [ ] Verify status polling works

### Stage 4: API Response Verification
- [ ] GET /api/audits returns list
- [ ] GET /api/audits/[id] returns full details with stepResults
- [ ] Verify all step data shapes match expected format

### Stage 5: UI Component Verification
- [ ] Dashboard shows real stats
- [ ] Audit list shows real audits
- [ ] Audit detail shows real scores and data
- [ ] No placeholder/mock data visible

### Known Issues Found
1. **Bot Blocking**: Some websites (Varnish CDN) return 403 - need user-agent rotation or proxy
2. **userId validation**: ✅ FIXED - relaxed from CUID to any string for development

## Phase 5: Authentication ✅ COMPLETE

- [x] Install NextAuth.js (next-auth@5.0.0-beta.30)
- [x] Configure auth providers (Credentials)
- [x] Create login/register pages
- [x] Protect API routes
- [x] Auth middleware for route protection

## Phase 6: Enhanced Audit Inputs & GBP Fix ✅ COMPLETE

**Goal**: Fix Local SEO empty state by enabling manual GBP input and integrating Google Places API.

### Phase 6.1: Enhanced Audit Creation Form ✅ COMPLETE
- [x] Update Prisma schema with new fields (businessName, location, gmbPlaceId, targetKeywords, competitorDomains)
- [x] Apply database schema with `npx prisma db push`
- [x] Update `src/types/audit.ts` with AuditFormData interface
- [x] Redesign NewAuditForm with sections (Business/Location visible, Advanced collapsible)
- [x] Update `src/app/api/audits/route.ts` to accept new fields
- [x] Update `src/lib/db/audit-operations.ts` createAudit function
- [x] Update Inngest event data to pass new fields
- [x] Install shadcn/ui collapsible component
- [x] Verify build passes

### Phase 6.2: Google Places API Integration ✅ COMPLETE
**Prerequisites** (done by user):
- [x] Create Google Cloud Project
- [x] Enable Places API
- [x] Create API key with Places API restriction
- [x] Add `GOOGLE_PLACES_API_KEY` to `.env.local`

**Implementation**:
- [x] Create `src/lib/google-places/client.ts` - Places API wrapper
- [x] Create `src/lib/google-places/types.ts` - Type definitions
- [x] Create `src/lib/google-places/index.ts` - Barrel exports
- [x] Implement `findPlace()` for business name + location search
- [x] Implement `getPlaceDetails()` for rating, reviews, hours, photos, categories
- [x] Implement `lookupBusiness()` convenience method
- [x] Implement `getBusinessByPlaceId()` for direct Place ID lookup
- [x] Update `runBusinessStep()` in `audit-functions.ts` with Google Places API priority
- [x] Fall back to DataForSEO if Places API not configured or returns no results
- [x] Update Inngest event types to include new fields
- [x] All 818 tests passing

### Phase 6.3: Target Keywords Integration ✅ COMPLETE
- [x] Add user-specified targetKeywords to SERP step
- [x] Store results in `stepResults.serp.trackedKeywords`
- [x] Display tracked vs discovered keywords in separate tabs (already exists in audit detail page)

### Phase 6.4: Competitor Analysis ✅ COMPLETE
- [x] Created `SEOCompetitorMetrics` interface in `src/types/audit.ts`
- [x] Created `CompetitorStepResult` interface (targetMetrics, competitors, discoveredCompetitors)
- [x] Added `COMPETITOR_ANALYSIS` to `AuditStep` enum
- [x] Implemented `runCompetitorStep()` function in `audit-functions.ts`
- [x] Added competitor step to orchestrator (between backlinks and business)
- [x] Updated `StepResultsJson` to include `competitors`
- [x] Added `transformSEOCompetitorMetrics` helper function to audit detail page
- [x] Wired CompetitorComparison component to display SEO competitors
- [x] All 818 tests passing, build passes

### Phase 6.5: Location-Based SERP ✅ COMPLETE
- [x] Created `formatLocationName()` helper to convert "City, ST" → DataForSEO format
- [x] Pass location from orchestrator to `runSerpStepWithLabs()`
- [x] Updated Labs API call with locationName
- [x] Updated SERP module methods (`findDomainRanking`, `analyzeSerpFeatures`) to accept locationOptions
- [x] All 818 tests passing, build passes

### Phase 6.6: HTTPS Verification Fix ✅ COMPLETE
- [x] Added `httpsVerified` and `httpsVerificationMismatch` fields to `OnPageStepResult` type
- [x] Created `verifyHttps()` function with 10s timeout using AbortController
- [x] Updated `runOnPageStep()` to run HTTPS verification in parallel
- [x] Compare direct verification result with DataForSEO's `httpsEnabled` flag
- [x] Added UI warning banner in audit detail page when mismatch detected
- [x] All 818 tests passing, build passes

## Phase 7: Full OnPage Data Display ✅ COMPLETE

**Goal**: Display ALL data from DataForSEO `instant_pages` API in the UI (was throwing away 80%+ of available data).

### Implementation ✅ COMPLETE (2025-11-28)

- [x] Added 6 new interfaces to `src/types/audit.ts`:
  - OnPageMeta (title, description, htags, links, images)
  - OnPageContent (word count, 5 readability scores, consistency)
  - OnPageTiming (10 timing metrics: TTI, DOM complete, LCP, FID, etc.)
  - OnPageChecks (18+ boolean SEO checks)
  - OnPageResources (size, server, cache, warnings)
  - OnPageWarning (error line/column/message)
- [x] Extended `OnPageStepResult` interface with new optional fields
- [x] Updated `runOnPageStep()` in `audit-functions.ts` to extract ALL data (~140 line return block)
- [x] Created `OnPageFullReport.tsx` component (~600 lines) with 5 accordion sections:
  - Meta Details: Title/description status, heading tree, link/image counts
  - Content Details: Word count, 5 readability scores with progress bars, consistency
  - Timing Details: 9 metrics with color-coded thresholds (green/yellow/red)
  - SEO Checks: 18+ pass/fail indicators with progress summary
  - Resources: Size stats, server info, cache TTL, warnings list
- [x] Added export to `src/components/audit/index.ts`
- [x] Replaced Technical tab in audit detail page with OnPageFullReport
- [x] Build passes, all 818 tests passing

### Key Files Modified

- `src/types/audit.ts` - Added 6 new interfaces
- `src/lib/inngest/audit-functions.ts` - Expanded data extraction
- `src/components/audit/OnPageFullReport.tsx` - NEW component
- `src/components/audit/index.ts` - Added export
- `src/app/(dashboard)/audits/[id]/page.tsx` - Replaced Technical tab

---

## Phase 8: Keyword Enrichment & Display ✅ COMPLETE (2025-12-04)

**Goal**: Enrich target keywords with search volume, CPC, and bid data using DataForSEO Labs Historical Keyword Data API.

**Problem**: Google Ads stopped showing specific keyword data for "dentist + city" type keywords (policy change). The regular keyword APIs return empty/null data. However, the Historical Keyword Data API still has the last available data (typically late 2023/2024). For service keywords like "dental implants chicago", 2025 data IS available.

**Solution**: Smart fallback enrichment strategy:
- If 2025 data exists → use it
- If 2025 is empty → use the most recent month that has data (2024, 2023, etc.)
- Flag `historicalDataDate` field for transparency (clock icon + tooltip in UI)

**User Decisions**:
- Enrichment Timing: Dynamic keyword management (add/remove keywords from existing audits)
- Scope: Enrich BOTH tracked AND discovery keywords
- UI Indicator: Clock icon with tooltip showing data date

### Phase 8A: Core Enrichment ✅ COMPLETE

**Step 1: Add getHistoricalKeywordData method to Labs module** ✅ COMPLETE
- [x] Added `DataforseoLabsGoogleHistoricalKeywordDataLiveRequestInfo` import to `labs.ts`
- [x] Added `HistoricalKeywordDataInput`, `HistoricalKeywordDataItem` imports
- [x] Implemented `getHistoricalKeywordData()` method with caching (7-day TTL)
- [x] Added `historicalKeywords` cache key generator to `cache-keys.ts`

**Step 2: Add Zod schemas for historical keyword data** ✅ COMPLETE
- [x] Created `historicalKeywordDataInputSchema` (keywords, locationCode, locationName, languageCode)
- [x] Created `historicalKeywordInfoSchema` (search_volume, cpc, competition, bids, trends)
- [x] Created `historicalKeywordMonthSchema` (year, month, keyword_info)
- [x] Created `historicalKeywordDataItemSchema` (keyword, location, language, history[])
- [x] Added type exports to `labs.ts`

**Step 3: Create keyword enrichment utility** ✅ COMPLETE
- [x] Created `src/lib/dataforseo/utils/keyword-enrichment.ts`
- [x] Implemented `EnrichmentResult` and `EnrichmentOptions` interfaces
- [x] Implemented `enrichKeywordsWithHistoricalData()` function
- [x] Logic: batch keywords (max 700), iterate history newest-first, find first month with data
- [x] Bug fix (Session 44): Filter now includes `searchVolume === 0` (SERP returns 0, not null)
- [x] Added debug logging throughout enrichment flow

**Step 4: Integrate enrichment into SERP step** ✅ COMPLETE
- [x] Updated `runSerpStepWithLabs()` in `audit-functions.ts` (lines 869-904)
- [x] Enriches discovery keywords
- [x] Enriches tracked keywords
- [x] Merge enriched data into keyword results
- [x] Bug fix (Session 44): Force `locationName = 'United States'` (Historical API only works with country-level)

**Step 5: Update types (KeywordData interface)** ✅ COMPLETE
- [x] Added `lowTopOfPageBid`, `highTopOfPageBid` fields to `src/types/audit.ts`
- [x] Added `historicalDataDate` field (format: "2025-10" or "2023-12")
- [x] Helper functions: `isHistoricalData()`, `formatHistoricalDataDate()`

**Step 6: Update KeywordTable with data date tooltip** ✅ COMPLETE
- [x] Clock icon next to search volume for historical data (`src/components/audit/KeywordTable.tsx:507-521`)
- [x] Tooltip shows: "Data from Oct 2023" with helper text
- [x] Uses `formatHistoricalDataDate()` for user-friendly display

**Bug Fixes (Session 44 - 2025-12-02)**:
1. Enrichment filter: Added `|| kw.searchVolume === 0` (SERP returns 0 not null for blocked keywords)
2. Labs module: Fixed response parsing to use `task.result[0].items` (was using `task.result` directly)
3. Location format: Force `enrichmentLocation = 'United States'` (Historical API rejects city-level locations)

### Phase 8B: Dynamic Keyword Management ✅ COMPLETE

- [x] Step 7: Database schema for TrackedKeyword model (`prisma/schema.prisma`)
- [x] Step 8: API routes for keyword CRUD (`src/app/api/keywords/`)
- [x] Step 9: Keyword operations (`src/lib/db/keyword-operations.ts`)
- [x] Step 10: KeywordManager UI component (`src/components/audit/KeywordManager.tsx`)
- [x] Step 11: Full SERP integration with enrichment

### Phase 8C: City/State Preset Keywords ✅ COMPLETE

**Goal**: When user provides city/state in the audit form, auto-generate 85 dental keywords and track them.

**Implementation**:
- [x] Step 1: Add `city` and `state` fields to API schema (`src/app/api/audits/route.ts`)
- [x] Step 2: Update `createAudit()` to save city/state (`src/lib/db/audit-operations.ts`)
- [x] Step 3: Send city/state from NewAuditForm to API (`src/components/audit/NewAuditForm.tsx`)
- [x] Step 4: Call `generateKeywordsForLocation()` in API route when city/state provided
- [x] Step 5: Call `addTrackedKeywords()` to persist preset keywords
- [x] Step 6: Enrichment working - historical data with clock icons displayed

### Key Files (Phase 8)

- `src/lib/dataforseo/modules/labs.ts` - `getHistoricalKeywordData()` method ✅
- `src/lib/dataforseo/schemas/labs.ts` - Zod schemas for historical data ✅
- `src/lib/dataforseo/cache/cache-keys.ts` - `historicalKeywords` cache key ✅
- `src/lib/dataforseo/utils/keyword-enrichment.ts` - Enrichment utility ✅
- `src/lib/inngest/audit-functions.ts:869-904` - SERP step integration ✅
- `src/types/audit.ts` - `KeywordData` interface extensions ✅
- `src/components/audit/KeywordTable.tsx:507-521` - Clock icon + tooltip ✅
- `scripts/test-historical-enrichment.ts` - Standalone test script ✅

---

## Backlog

- [ ] Email notifications
- [ ] PDF report generation
- [ ] Multi-tenant support
- [ ] Advanced analytics
- [ ] White-label customization
- [x] Sentry error tracking integration ✅
- [ ] Better Stack uptime monitoring (manual setup required)

### Phase 8D: KeywordTable Polish ✅ COMPLETE (2025-12-04)

**Final Working State**: KeywordTable now displays all enriched data correctly:
- ✅ Keyword + ranking URL
- ✅ Google Organic position (color-coded by rank)
- ✅ Volume with clock icon (⏱) for historical data
- ✅ CPC values
- ✅ Competition badges (LOW/MEDIUM/HIGH with color coding)
- ✅ Low Bid / High Bid values

**Columns Removed** (per user preference):
- Intent column (removed)
- Trend column (removed)

**Screenshot Verified**: 2025-12-04 - All columns displaying correctly with real audit data

### Session 46: Keywords Tab Simplification ✅ COMPLETE (2025-12-04)

**User Request**: Remove all keyword position tracking metrics and summary statistics.

**What Was Removed**:
- MetricCards grid (Keywords Tracked, Avg Position, Top 3, Top 10, Total ETV, Traffic Cost)
- KeywordMovementCard (up/down/stable/new keywords)
- PositionDistribution (position bucket bar chart)
- Summary badges in KeywordTable header (Top 3, Top 10, Avg)
- Backend calculation logic for all the above

**What Remains**:
- KeywordTable data table only (position, volume, CPC, competition, bids)
- Clock icon for historical data indication
- Historical enrichment from Labs API

See Session 46 in PROGRESS.md for full file-by-file breakdown.

---

## Phase 9: OnPage 3-Tab Reorganization ✅ COMPLETE (2025-12-06)

**Goal**: Reorganize the monolithic OnPageFullReport.tsx (942 lines) into a SEMRush-inspired 3-tab structure with configurable thresholds and proper issue categorization.

### User Decisions (via AskUserQuestion)

- **Tab Structure**: 3 Tabs (On-Page Content + Technical Issues + Performance/Lighthouse)
- **Fix Guidance**: Expandable rows with guidance (placeholder - content to be added later)
- **Thematic Cards**: Display on Technical Issues tab
- **Heading Display**: Nested tree view with actual H1-H6 text

### Phase 9.1: Core Infrastructure ✅ COMPLETE

- [x] Created `src/lib/constants/seo-thresholds.ts`:
  - `SEO_THRESHOLDS` - Configurable thresholds for title, description, Core Web Vitals, content, performance
  - `THEMATIC_SCORE_WEIGHTS` - Weighted scoring for 6 thematic categories
  - `ISSUE_SEVERITY_CONFIG` - Arrays categorizing 50+ checks into errors/warnings/notices
- [x] Created `src/components/audit/onpage/types.ts` - Interfaces for issues, thematic reports
- [x] Created `src/components/audit/onpage/issue-classification.ts` - ISSUE_DEFINITIONS mapping all checks
- [x] Created `src/components/audit/onpage/thematic-reports.ts` - Score calculation functions
- [x] Created `src/components/audit/onpage/index.ts` - Barrel exports

### Phase 9.2: Building Block Components ✅ COMPLETE

- [x] `issues-tab/IssueRow.tsx` - Expandable issue with severity colors
- [x] `issues-tab/IssuesSummary.tsx` - Error/Warning/Notice/Passed count cards
- [x] `issues-tab/ThematicReportCard.tsx` - Individual card with circular progress
- [x] `issues-tab/ThematicReportGrid.tsx` - 6-card grid layout
- [x] `issues-tab/index.ts` - Barrel export

### Phase 9.3: Content Tab ✅ COMPLETE

- [x] `content-tab/MetaTagsSection.tsx` - Title/description with length indicators
- [x] `content-tab/HeadingTree.tsx` - Nested H1-H6 tree with actual text
- [x] `content-tab/SocialTagsSection.tsx` - OG and Twitter tags in grid
- [x] `content-tab/ContentAnalysis.tsx` - Word count, readability, consistency
- [x] `content-tab/OnPageContentTab.tsx` - Compose all content sections
- [x] `content-tab/index.ts` - Barrel export

### Phase 9.4: Issues Tab ✅ COMPLETE

- [x] `issues-tab/TechnicalIssuesTab.tsx` - Thematic cards + issues lists with filters

### Phase 9.5: Performance Tab ✅ COMPLETE

- [x] `performance-tab/CoreWebVitalsCard.tsx` - LCP/FID/CLS with Google thresholds
- [x] `performance-tab/PageTimingSection.tsx` - Connection and render timing
- [x] `performance-tab/ResourcesSection.tsx` - Page size and compression stats
- [x] `performance-tab/LighthouseAudits.tsx` - Category scores + searchable audit list
- [x] `performance-tab/PerformanceLighthouseTab.tsx` - Compose all performance sections
- [x] `performance-tab/index.ts` - Barrel export

### Phase 9.6: Integration ✅ COMPLETE

- [x] Created `OnPageTabsContainer.tsx` - 3-tab parent container
- [x] Updated `src/app/(dashboard)/audits/[id]/page.tsx` - Use OnPageTabsContainer
- [x] Updated `src/components/audit/index.ts` - Added deprecation comment
- [x] Renamed `OnPageFullReport.tsx` → `OnPageFullReport.deprecated.tsx`

### Key Files Created (21 New Files)

```
src/lib/constants/seo-thresholds.ts

src/components/audit/onpage/
├── index.ts
├── types.ts
├── issue-classification.ts
├── thematic-reports.ts
├── OnPageTabsContainer.tsx
├── content-tab/
│   ├── index.ts, OnPageContentTab.tsx, MetaTagsSection.tsx
│   ├── HeadingTree.tsx, SocialTagsSection.tsx, ContentAnalysis.tsx
├── issues-tab/
│   ├── index.ts, TechnicalIssuesTab.tsx, ThematicReportGrid.tsx
│   ├── ThematicReportCard.tsx, IssuesSummary.tsx, IssueRow.tsx
└── performance-tab/
    ├── index.ts, PerformanceLighthouseTab.tsx, CoreWebVitalsCard.tsx
    ├── PageTimingSection.tsx, ResourcesSection.tsx, LighthouseAudits.tsx
```

### Phase 9.7: Build Fixes ✅ COMPLETE (Session 50)

- [x] Fixed `Lighthouse` icon → `Gauge` (lucide-react)
- [x] Fixed `Spider` icon → `Bug` (lucide-react)
- [x] Fixed HeadingTree.tsx TypeScript errors (defaultConfig, unused index)
- [x] Fixed issue-classification.ts array includes type error
- [x] Removed unused LighthouseAudit import

### Phase 9.8: Testing ⏳ PENDING

- [ ] Run `npm run seed:audit` to test full audit flow
- [ ] Verify all 3 tabs display data correctly
- [ ] Verify expandable issue rows work
- [ ] Remove skipCache debug flag from onpage.ts after verification

---

## Local SEO Map Rank Tracker ✅ COMPLETE (Sessions 51-52)

**Goal**: SEMRush-inspired 7x7 grid map rankings with competitor analysis and GBP dashboard.

### Database Schema ✅ COMPLETE
- [x] LocalCampaign model (business name, location, grid config, keywords)
- [x] GridScan model (scan status, progress, aggregated metrics)
- [x] GridPointResult model (row, col, lat, lng, rank, topRankings)
- [x] CompetitorStat model (aggregated competitor metrics per scan)
- [x] GBPSnapshot model (rating, reviews, completeness, attributes)

### Core Library ✅ COMPLETE
- [x] `grid-calculator.ts` - Haversine GPS coordinate generation
- [x] `grid-scanner.ts` - DataForSEO Maps API integration
- [x] `competitor-aggregator.ts` - Stats aggregation functions
- [x] `types.ts` - TypeScript interfaces
- [x] `local-campaign-operations.ts` - Database CRUD

### Inngest Functions ✅ COMPLETE
- [x] `runGridScan` - 11-step scan orchestrator
- [x] `refreshGBPData` - GBP snapshot capture
- [x] `scheduledScanTrigger` - Cron for scheduled scans

### API Routes ✅ COMPLETE (8 endpoints)
- [x] `/api/local-seo/campaigns` - GET/POST
- [x] `/api/local-seo/campaigns/[id]` - GET/PUT/DELETE
- [x] `/api/local-seo/campaigns/[id]/scan` - POST
- [x] `/api/local-seo/campaigns/[id]/scans` - GET
- [x] `/api/local-seo/campaigns/[id]/scans/[scanId]` - GET
- [x] `/api/local-seo/campaigns/[id]/scans/[scanId]/grid` - GET
- [x] `/api/local-seo/campaigns/[id]/competitors` - GET
- [x] `/api/local-seo/campaigns/[id]/gbp` - GET

### UI Components ✅ COMPLETE (17 components)
- [x] GridMap, GridCell, GridLegend, GridPointDetail
- [x] CampaignCard, CampaignForm
- [x] CompetitorTable, CompetitorShareChart
- [x] KeywordGridSelector, ScanProgressIndicator
- [x] HistoryTimeline, RankTrendChart
- [x] GBPDashboard, GBPProfileSection, GBPReviewsSection, GBPAttributesSection

### Dashboard Pages ✅ COMPLETE (7 pages)
- [x] `/local-seo` - Campaign list
- [x] `/local-seo/new` - Create campaign
- [x] `/local-seo/[campaignId]` - Campaign dashboard
- [x] `/local-seo/[campaignId]/grid` - Full-screen grid
- [x] `/local-seo/[campaignId]/competitors` - Competitor deep-dive
- [x] `/local-seo/[campaignId]/history` - Historical snapshots
- [x] `/local-seo/[campaignId]/gbp` - GBP dashboard

### TypeScript Fixes ✅ COMPLETE (Session 52)
- [x] Fixed unused imports/variables in all components
- [x] Fixed Inngest JsonifyObject type casting
- [x] Fixed CacheOptions properties (skip → skipRead)
- [x] Fixed Zod resolver type mismatch in CampaignForm
- [x] Build passes successfully

### Map Integration ✅ COMPLETE (Session 54 - 2025-12-07)
- [x] Install Leaflet: `npm install leaflet react-leaflet @types/leaflet`
- [x] Create `MapWithGrid.tsx` - Leaflet map with grid overlay
- [x] Add Leaflet CSS import to `globals.css`
- [x] Custom DivIcon markers with rank numbers (1-20)
- [x] Red marker for business center
- [x] Color-coded circles (green/yellow/orange/red)
- [x] Click popups with rank details and top competitors
- [x] Update `GridMap.tsx` with Map/Grid view toggle
- [x] Auto-select center point on load
- [x] Reorganize campaign page to 2-column layout
- [x] Change default radius to 3 miles
- [x] Add 1mi, 2mi, 3mi, 5mi, 10mi, 15mi options
- [x] Build passes

### GBP Comparison Feature ✅ COMPLETE (Sessions 65-66)
- [x] `src/lib/local-seo/gbp-comparison.ts` - Comparison service
- [x] `src/app/api/local-seo/campaigns/[id]/gbp-comparison/route.ts` - API endpoint
- [x] 8 UI components in `src/components/local-seo/gbp-comparison/`:
  - GBPComparisonDashboard (6-tab container)
  - ComparisonTable (side-by-side comparison)
  - GapsCard (gap display with severity)
  - ManualChecksCard (manual checks reminder)
  - KeywordComparisonSelector
  - FetchDetailedDataButton (manual trigger for Posts/Q&A/Reviews)
  - PostsComparisonCard (posting activity comparison)
  - QAComparisonCard (Q&A engagement comparison)
- [x] Dashboard page: `/local-seo/[campaignId]/gbp-comparison`
- [x] Navigation: "GBP Compare" button in campaign header

**Features:**
- Compares target GBP vs top 3 competitors from geo-grid scans
- 13+ comparison fields (rating, reviews, categories, photos, hours, attributes, etc.)
- Gap identification with severity (critical/important/nice-to-have)
- Automatic recommendations
- 4-hour cache TTL

**Enhanced GBP Data (Session 66):**
- [x] **Posts Comparison**: Count, frequency, last post date, activity level
- [x] **Q&A Comparison**: Questions count, answer rate, unanswered alerts
- [x] **Manual Fetch Button**: Click to fetch Posts/Q&A/Reviews from DataForSEO
- [x] Task-based API: POST task → Poll tasks_ready → GET results
- [x] Database: `gbp_detailed_profiles` table for detailed GBP data

**Data Flow Fix (Session 67):**
- [x] **Fixed Posts/Q&A tabs data wiring** - API now returns `detailedData` from database
- [x] Dashboard uses actual data instead of hardcoded nulls

### Pending Enhancements (Sprint 2+)
- [ ] Reviews comparison (sentiment, response rate, highlights)
- [ ] Services/Products comparison
- [ ] DataFreshnessCard (replaces ManualChecksCard)
- [ ] Add scheduled scan automation
- [ ] Historical trend charts
- [ ] Export to PDF/CSV

---

## Phase 10: Site Audit Feature ✅ COMPLETE

**Status**: ✅ COMPLETE (Session 60-63)
**Goal**: Full site crawl using DataForSEO OnPage API Task POST/GET workflow (not instant_pages)

> **Plan Review Notes** (2025-12-08):
> - Verified all API endpoints against DataForSEO docs
> - **Key Fix**: Pages/Resources/Links use POST with `id` in body, NOT GET with path params
> - Added `crawlStopReason` field to track why crawls ended
> - Clarified avgLcp/avgCls are calculated from pages, not Summary API
> - Added `pageMetricsChecks` JSON field for detailed issue breakdown

### Overview

Add a new "Site Audit" feature that enables complete site crawls (50-500 pages) with comprehensive SEO analysis. This is **separate from existing audits** which use single-page `instant_pages` analysis.

**Key Difference**:
- **Existing Audits**: Single-page instant analysis via `on_page_instant_pages` + `on_page_lighthouse`
- **Site Audit (NEW)**: Full site crawl with 60+ SEO checks per page, resource analysis, link mapping, duplicate detection

### User Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page limits | Conservative: Default 100, Max 500 | Cost control, dental sites typically small |
| JavaScript rendering | Always ON | Accurate Core Web Vitals |
| Integration | Linkable to existing audits | Optional `auditId` foreign key |
| Data scope | Standard | Summary + Pages + Resources + Links |

### Database Schema

Add to `prisma/schema.prisma`:

```prisma
enum SiteAuditStatus {
  PENDING
  SUBMITTING
  CRAWLING
  FETCHING_RESULTS
  COMPLETED
  FAILED
}

model SiteAuditScan {
  id                      String              @id @default(cuid())
  userId                  String
  domain                  String              @db.VarChar(255)
  status                  SiteAuditStatus     @default(PENDING)
  progress                Int                 @default(0)

  // DataForSEO task tracking
  taskId                  String?             @db.VarChar(100)

  // Crawl configuration
  maxCrawlPages           Int                 @default(100)
  enableJavascript        Boolean             @default(true)   // Always on
  enableBrowserRendering  Boolean             @default(true)   // Always on for CWV
  storeRawHtml            Boolean             @default(false)
  calculateKeywordDensity Boolean             @default(false)
  startUrl                String?             @db.VarChar(500)

  // Optional link to existing audit
  auditId                 String?
  audit                   audits?             @relation(fields: [auditId], references: [id], onDelete: SetNull)

  // Timing & cost
  startedAt               DateTime?
  completedAt             DateTime?
  apiCost                 Decimal?            @db.Decimal(10, 4)
  errorMessage            String?

  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt

  // Relations
  user                    users               @relation(fields: [userId], references: [id], onDelete: Cascade)
  summary                 SiteAuditSummary?
  pages                   SiteAuditPage[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([taskId])
}

model SiteAuditSummary {
  id                 String   @id @default(cuid())
  scanId             String   @unique

  // Crawl stats
  totalPages         Int      @default(0)
  crawledPages       Int      @default(0)
  crawlStopReason    String?  @db.VarChar(50)  // limit_exceeded | empty_queue | force_stopped

  // Issue counts (from page_metrics.checks)
  errorsCount        Int      @default(0)
  warningsCount      Int      @default(0)
  noticesCount       Int      @default(0)

  // Aggregates (onpageScore from page_metrics, LCP/CLS calculated from pages)
  onpageScore        Decimal? @db.Decimal(5, 2)  // Site-wide score from Summary API
  avgLcp             Decimal? @db.Decimal(10, 2) // Calculated from pages after fetch
  avgCls             Decimal? @db.Decimal(5, 4)  // Calculated from pages after fetch

  // Resources & links (from page_metrics)
  totalImages        Int      @default(0)
  brokenResources    Int      @default(0)
  internalLinks      Int      @default(0)
  externalLinks      Int      @default(0)
  brokenLinks        Int      @default(0)
  nonIndexable       Int      @default(0)        // From page_metrics.non_indexable
  duplicateTitle     Int      @default(0)        // From page_metrics.duplicate_title
  duplicateDescription Int    @default(0)        // From page_metrics.duplicate_description

  // Domain info (JSON for flexibility)
  domainInfo         Json?    // name, cms, ip, server, crawl_start, crawl_end
  sslInfo            Json?    // valid_certificate, certificate_issuer, expiration_date
  pageMetricsChecks  Json?    // Full page_metrics.checks object for detailed breakdown

  createdAt          DateTime @default(now())
  scan               SiteAuditScan @relation(fields: [scanId], references: [id], onDelete: Cascade)
}

model SiteAuditPage {
  id                 String   @id @default(cuid())
  scanId             String

  url                String   @db.VarChar(2000)
  urlHash            String   @db.VarChar(64)
  statusCode         Int

  // Scores
  onpageScore        Decimal? @db.Decimal(5, 2)

  // Meta
  title              String?  @db.VarChar(1000)
  description        String?  @db.VarChar(2000)
  h1Tags             String[] @default([])

  // Content
  wordCount          Int?

  // Timing & checks (JSON for 60+ fields)
  pageTiming         Json?
  checks             Json?

  // Denormalized for filtering
  issueTypes         String[] @default([])
  issueCount         Int      @default(0)

  createdAt          DateTime @default(now())
  scan               SiteAuditScan @relation(fields: [scanId], references: [id], onDelete: Cascade)

  @@unique([scanId, urlHash])
  @@index([scanId, onpageScore(sort: Desc)])
  @@index([scanId, issueCount(sort: Desc)])
}
```

**Also add relation to existing `audits` model**:
```prisma
model audits {
  // ... existing fields
  siteAuditScans  SiteAuditScan[]
}
```

### Files to Create/Modify

#### 1. DataForSEO OnPage Module (`src/lib/dataforseo/modules/onpage.ts`)

Add new methods for task-based workflow:

```typescript
// NEW METHODS TO ADD:

// POST /v3/on_page/task_post - Submit crawl task
async submitCrawlTask(input: SiteCrawlTaskInput): Promise<{ taskId: string }>

// GET /v3/on_page/tasks_ready - Check for completed tasks (20 req/min limit!)
async getTasksReady(): Promise<TaskReadyResult[]>

// GET /v3/on_page/summary/{taskId} - Get summary (task_id in URL path)
async getCrawlSummary(taskId: string): Promise<CrawlSummaryResult>

// POST /v3/on_page/pages - Get pages (task_id in body, NOT path!)
async getCrawledPages(taskId: string, options: PaginationOptions): Promise<PaginatedPages>
// Body: { id: taskId, limit, offset, filters?, order_by? }

// POST /v3/on_page/resources - Get resources (task_id in body, NOT path!)
async getCrawledResources(taskId: string, options: PaginationOptions): Promise<PaginatedResources>
// Body: { id: taskId, limit, offset, filters?, order_by? }

// POST /v3/on_page/links - Get links (task_id in body, NOT path!)
async getCrawledLinks(taskId: string, options: PaginationOptions): Promise<PaginatedLinks>
// Body: { id: taskId, limit, offset, filters?, order_by? }

// POST /v3/on_page/force_stop - Force stop crawl
async forceStopTask(taskId: string): Promise<void>
// Body: { id: taskId }

// Future enhancements:
// async getDuplicateContent(taskId: string, type: 'title' | 'description'): Promise<DuplicatesResult>
// async getNonIndexablePages(taskId: string): Promise<NonIndexableResult>
// async getRedirectChains(taskId: string): Promise<RedirectChainsResult>
```

#### 2. Zod Schemas (`src/lib/dataforseo/schemas/onpage.ts`)

Add input/output schemas:
- `siteCrawlTaskInputSchema` - Crawl configuration
- `crawlSummaryResultSchema` - Summary response
- `crawledPageSchema` - Individual page data
- `crawledResourceSchema` - Resource data
- `crawledLinkSchema` - Link data
- `paginationOptionsSchema` - Limit/offset/filters

#### 3. Database Operations (`src/lib/db/site-audit-operations.ts`) - NEW FILE

```typescript
export async function createSiteAuditScan(userId: string, config: CreateScanInput): Promise<string>
export async function getSiteAuditScan(scanId: string): Promise<SiteAuditScan | null>
export async function getSiteAuditScanWithRelations(scanId: string): Promise<SiteAuditScanFull | null>
export async function updateScanStatus(scanId: string, status: SiteAuditStatus): Promise<void>
export async function updateScanProgress(scanId: string, progress: number): Promise<void>
export async function updateScanTaskId(scanId: string, taskId: string): Promise<void>
export async function saveSiteAuditSummary(scanId: string, summary: SummaryData): Promise<void>
export async function saveSiteAuditPages(scanId: string, pages: PageData[]): Promise<void>
export async function listUserScans(userId: string, options: ListOptions): Promise<ScanListResult>
export async function completeScan(scanId: string, metrics: CompletionMetrics): Promise<void>
export async function failScan(scanId: string, error: string): Promise<void>
export async function deleteScan(scanId: string): Promise<void>
```

#### 4. Inngest Functions (`src/lib/inngest/site-audit-functions.ts`) - NEW FILE

```typescript
import { inngest } from '../inngest';

export const runSiteAudit = inngest.createFunction(
  {
    id: 'site-audit-orchestrator',
    retries: 3,
    throttle: { limit: 5, period: '1m' } // Respect rate limits
  },
  { event: 'site-audit/scan.requested' },
  async ({ event, step }) => {
    const { scanId, domain, config } = event.data;

    // Step 1: Update status to SUBMITTING
    await step.run('update-status-submitting', async () => {
      await updateScanStatus(scanId, 'SUBMITTING');
    });

    // Step 2: Submit task to DataForSEO
    const taskId = await step.run('submit-crawl-task', async () => {
      const result = await onpageModule.submitCrawlTask({
        target: domain,
        max_crawl_pages: config.maxCrawlPages,
        enable_javascript: true,
        enable_browser_rendering: true,
        load_resources: true,
        // ... other config
      });
      await updateScanTaskId(scanId, result.taskId);
      return result.taskId;
    });

    // Step 3: Update status to CRAWLING
    await step.run('update-status-crawling', async () => {
      await updateScanStatus(scanId, 'CRAWLING');
    });

    // Step 4: Poll for completion (with sleep + exponential backoff)
    let isReady = false;
    let pollCount = 0;
    const maxPolls = 60; // 30 min max with 30s intervals

    while (!isReady && pollCount < maxPolls) {
      await step.sleep('poll-delay', `${Math.min(30 + pollCount * 5, 60)}s`);

      isReady = await step.run(`check-ready-${pollCount}`, async () => {
        const tasks = await onpageModule.getTasksReady();
        return tasks.some(t => t.id === taskId);
      });

      pollCount++;
      await step.run(`update-progress-${pollCount}`, async () => {
        await updateScanProgress(scanId, Math.min(pollCount * 2, 50));
      });
    }

    if (!isReady) {
      throw new Error('Crawl timed out after 30 minutes');
    }

    // Step 5: Update status to FETCHING_RESULTS
    await step.run('update-status-fetching', async () => {
      await updateScanStatus(scanId, 'FETCHING_RESULTS');
    });

    // Step 6: Fetch summary
    const summary = await step.run('fetch-summary', async () => {
      return await onpageModule.getCrawlSummary(taskId);
    });

    // Step 7: Fetch pages (paginated)
    const pages = await step.run('fetch-pages', async () => {
      const allPages: CrawledPage[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const batch = await onpageModule.getCrawledPages(taskId, { limit, offset });
        allPages.push(...batch.items);
        if (batch.items.length < limit) break;
        offset += limit;
      }

      return allPages;
    });

    // Step 8: Fetch resources
    const resources = await step.run('fetch-resources', async () => {
      return await onpageModule.getCrawledResources(taskId, { limit: 1000 });
    });

    // Step 9: Fetch links
    const links = await step.run('fetch-links', async () => {
      return await onpageModule.getCrawledLinks(taskId, { limit: 1000 });
    });

    // Step 10: Calculate CWV averages from pages (not in Summary API)
    const cwvAverages = await step.run('calculate-cwv-averages', async () => {
      const pagesWithCls = pages.filter(p => p.meta?.cumulative_layout_shift != null);
      const pagesWithLcp = pages.filter(p => p.page_timing?.largest_contentful_paint != null);

      return {
        avgCls: pagesWithCls.length > 0
          ? pagesWithCls.reduce((sum, p) => sum + p.meta.cumulative_layout_shift, 0) / pagesWithCls.length
          : null,
        avgLcp: pagesWithLcp.length > 0
          ? pagesWithLcp.reduce((sum, p) => sum + p.page_timing.largest_contentful_paint, 0) / pagesWithLcp.length
          : null,
      };
    });

    // Step 11: Save to database
    await step.run('save-results', async () => {
      await saveSiteAuditSummary(scanId, { ...summary, ...cwvAverages });
      await saveSiteAuditPages(scanId, pages);
    });

    // Step 12: Complete
    await step.run('complete-scan', async () => {
      await completeScan(scanId, {
        totalPages: pages.length,
        apiCost: summary.cost,
      });
    });

    return { success: true, pagesScanned: pages.length };
  }
);

// Event type to add to src/lib/inngest.ts
type SiteAuditEvents = {
  'site-audit/scan.requested': {
    data: {
      scanId: string;
      domain: string;
      config: ScanConfig;
    };
  };
};
```

#### 5. API Routes Structure

```
src/app/api/site-audit/
├── route.ts                    # POST (create scan), GET (list scans)
└── scans/
    └── [scanId]/
        ├── route.ts            # GET (scan detail), DELETE (cancel/delete)
        ├── status/route.ts     # GET (poll status for progress bar)
        ├── pages/route.ts      # GET (paginated pages with filters)
        └── summary/route.ts    # GET (summary metrics)
```

**API Route Examples**:

```typescript
// POST /api/site-audit - Create new scan
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const validated = createScanSchema.parse(body);

  const scanId = await createSiteAuditScan(session.user.id, validated);

  await inngest.send({
    name: 'site-audit/scan.requested',
    data: { scanId, domain: validated.domain, config: validated },
  });

  return NextResponse.json({ scanId });
}

// GET /api/site-audit/scans/[scanId]/pages - Paginated pages
export async function GET(req: Request, { params }: { params: { scanId: string } }) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const filter = searchParams.get('filter'); // e.g., 'errors', 'warnings'

  const result = await getPagesPaginated(params.scanId, { page, limit, filter });
  return NextResponse.json(result);
}
```

#### 6. Dashboard Pages Structure

```
src/app/(dashboard)/site-audit/
├── page.tsx                    # List all scans with cards
├── new/page.tsx                # Create scan form
└── [scanId]/
    ├── page.tsx                # Scan overview dashboard
    └── pages/page.tsx          # Full paginated pages view
```

#### 7. UI Components (`src/components/site-audit/`)

| Component | Description |
|-----------|-------------|
| `ScanCard.tsx` | Card for scan list (domain, status, progress, date) |
| `ScanForm.tsx` | Create scan form (domain, page limit slider, start URL) |
| `ScanProgress.tsx` | Real-time progress during crawl (polls /status) |
| `ScanOverview.tsx` | Dashboard with summary metrics |
| `IssuesSummaryCard.tsx` | Errors/warnings/notices count cards |
| `PagesTable.tsx` | Paginated pages table with sorting |
| `PageFilters.tsx` | Filter controls (status, issues, score range) |
| `PageDetailDrawer.tsx` | Slide-out drawer for page details |

#### 8. Sidebar Update (`src/components/layout/Sidebar.tsx`)

```typescript
// Add new navigation item
{
  title: 'Site Audit',
  href: '/site-audit',
  icon: <Globe className="h-4 w-4" />,
  children: [
    { title: 'All Scans', href: '/site-audit' },
    { title: 'New Scan', href: '/site-audit/new' },
  ],
}
```

### Implementation Phases

#### Phase 10.1: Database & Infrastructure ✅ COMPLETE
- [x] Add Prisma models to schema (`site_audit_scans`, `site_audit_summaries`, `site_audit_pages`, `SiteAuditStatus` enum)
- [x] Run schema sync: `npx prisma db push`
- [x] Create `src/lib/db/site-audit-operations.ts` (all CRUD functions)
- [x] Add Inngest event types to `src/lib/inngest.ts`

#### Phase 10.2: DataForSEO Integration ✅ COMPLETE
- [x] Add OnPage module methods for task post/get (`submitCrawlTask`, `getTasksReady`, `getCrawlSummary`, `getCrawledPages`, etc.)
- [x] Add Zod schemas to `onpage.ts` (`siteCrawlTaskInputSchema`, `crawlSummaryResultSchema`, `crawledPageResultSchema`)
- [ ] Test API calls with script (like `seed-fielder-audit.ts`)

#### Phase 10.3: Background Job ✅ COMPLETE
- [x] Create `src/lib/inngest/site-audit-functions.ts`
- [x] Implement orchestrator with polling + exponential backoff
- [x] Register in Inngest route handler (`src/app/api/inngest/route.ts`)
- [ ] Test with Inngest dev server

#### Phase 10.4: API Routes ✅ COMPLETE
- [x] Create all API routes (7 total including issue exploration routes)
- [x] Implement pagination and filtering
- [x] Add auth protection

#### Phase 10.5: UI ✅ COMPLETE
- [x] Create UI components (12+ including issue components)
- [x] Create dashboard pages
- [x] Add to sidebar navigation
- [x] Test full flow end-to-end

#### Phase 10.6: Enhanced Issue Display ✅ COMPLETE (Session 63)
- [x] Fixed issue counts calculation bug
- [x] Added IssueExplorerTabs (4-tab container)
- [x] Added DuplicatesTable, RedirectsTable, NonIndexableTable
- [x] Fixed PageDetailDrawer check semantics (NEGATIVE_CHECKS pattern)
- [x] Added URL sorting option
- [x] Fixed Prisma Decimal to Number conversion

### Technical Reference

#### DataForSEO API Workflow

1. **Task POST** - `POST /v3/on_page/task_post`
   - Submit crawl configuration in body
   - Returns task ID immediately
   - Rate limit: 2000 req/min

2. **Tasks Ready** - `GET /v3/on_page/tasks_ready`
   - Poll to check if crawl is complete
   - Returns list of ready task IDs
   - **Rate limit: 20 req/min** (important!)
   - Tasks auto-removed after results collected

3. **Summary** - `GET /v3/on_page/summary/{task_id}`
   - Domain info, SSL, crawl stats, page_metrics
   - Contains `crawl_progress` ("in_progress" | "finished")
   - Contains `crawl_stop_reason` (limit_exceeded | empty_queue | force_stopped)
   - Rate limit: 2000 req/min

4. **Pages** - `POST /v3/on_page/pages` (NOT GET with path param!)
   - Body: `{ "id": "task_id", "limit": 100, "offset": 0, "filters": [...] }`
   - All crawled pages with 60+ checks
   - Supports pagination via limit/offset in body
   - Rate limit: 2000 req/min

5. **Resources** - `POST /v3/on_page/resources` (NOT GET with path param!)
   - Body: `{ "id": "task_id", "limit": 100, "offset": 0, "filters": [...] }`
   - Images, scripts, stylesheets
   - Broken resource detection
   - Rate limit: 2000 req/min

6. **Links** - `POST /v3/on_page/links` (NOT GET with path param!)
   - Body: `{ "id": "task_id", "limit": 100, "offset": 0, "filters": [...] }`
   - Internal/external links
   - Broken link detection
   - Rate limit: 2000 req/min

#### Polling Strategy

```typescript
const POLLING_CONFIG = {
  initialDelay: 30_000,      // 30 seconds
  maxDelay: 60_000,          // 60 seconds
  backoffMultiplier: 1.2,    // Exponential backoff
  maxWaitTime: 30 * 60_000,  // 30 minutes total
  rateLimit: 20,             // 20 req/min for Tasks Ready
};
```

**Important API Behavior**:
- Tasks Ready returns completed tasks that **haven't been collected yet**
- Once you fetch results (Summary, Pages, etc.), task is **removed** from tasks_ready
- Tasks remain in tasks_ready for **3 days max** if not collected
- Alternative: Use `pingback_url` in Task POST for push notifications (more efficient)

#### Cost Estimation

| Config | Cost per 100 pages |
|--------|-------------------|
| Basic (no JS) | ~$0.05 |
| JavaScript ON | ~$0.25 |
| Browser rendering ON | ~$0.50 |

**Our defaults (JS + Browser ON)**: ~$0.50 per 100 pages

#### Crawl Configuration Defaults

```typescript
const DEFAULT_CRAWL_CONFIG = {
  maxCrawlPages: 100,
  enableJavascript: true,        // Always on
  enableBrowserRendering: true,  // Always on for accurate CWV
  loadResources: true,
  storeRawHtml: false,           // Not needed, saves cost
  calculateKeywordDensity: false, // Future enhancement
};
```

### Data Scope (Standard)

**Included**:
1. Summary - Domain info, SSL, crawl stats, issue counts
2. Pages - All crawled pages with scores, meta, timing, 60+ checks
3. Resources - Images, scripts, stylesheets (broken detection)
4. Links - Internal/external links (broken detection)

**Excluded (Future Enhancement)**:
- Duplicate content detection
- Redirect chains
- Non-indexable pages analysis
- Keyword density analysis

---

## Developer Tools

### Test Data Seeding Script ✅ COMPLETE (Session 50)

**Purpose**: Re-run audits with same test data without manual form entry.

**Usage**:
```bash
npm run seed:audit
```

**What It Does**:
1. Finds test user (`test@example.com`)
2. Deletes existing audits for `fielderparkdental.com`
3. Loads 84 saved keywords from TrackedKeyword table
4. Creates audit directly via `createAudit()` (bypasses API auth)
5. Triggers Inngest via dev server HTTP POST
6. Polls status from database with progress bar
7. Prints URL when complete

**Hardcoded Test Data** (in `scripts/seed-fielder-audit.ts`):
- Domain: `fielderparkdental.com`
- Business: `Fielder Park Dental`
- Location: `Arlington, TX`
- GMB CID: `ChIJsat6ael9ToYRaTxlWHh7yxg`
- 5 Competitors: myamazingdental.com, ourarlingtondentist.com, arlingtonfamilydentistry.com, arlingtonbrightsmiles.com, smilesarlington.com
