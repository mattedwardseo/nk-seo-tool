# SEO Audit Platform - AI Assistant Context

**Last Updated**: 2025-12-30
**Current Phase**: Phase 18 - UI/UX Enhancements & GBP Deep Integration
**Tech Stack**: Next.js 16, TypeScript, Prisma, TimescaleDB, Inngest, Sentry
**Deployment**: Vercel (https://nk-seo-tool.vercel.app)
**Repository**: https://github.com/mattedwardseo/nk-seo-tool

## Quick Resume (Session 84)

**What We Did**: Vercel Deployment & Build Fixes

**Vercel Deployment Complete:**
- ✅ Pushed all code to GitHub (441 files, 116k+ insertions)
- ✅ Fixed TypeScript strict mode errors for production build
- ✅ Configured Sentry to skip source maps when not fully configured
- ✅ Fixed auth middleware login loop bug
- ✅ Added DataForSEO client `post()` method for AI Optimization API

**TypeScript Fixes:**
- ✅ AI SEO pages: removed unused imports (Sparkles, useRouter), fixed null checks
- ✅ DataForSEO client: added generic `post<T>()` method with proper typing
- ✅ AI Optimization module: typed all API responses with `DataForSEOResponse<T>`
- ✅ AI SEO operations: fixed Prisma `JsonNull` for JSON fields
- ✅ Inngest functions: fixed event data typing, variable scoping
- ✅ SEO factors: added null checks and non-null assertions

**Build Status**: ✅ Passing on Vercel

**Previous Session (83) - GBP Deep Integration:**
- Domain switcher with pinned/recent domains
- GBP standalone tool without campaign requirement
- Historical change columns for keyword tracking

> **Full session history**: See `PROGRESS.md`
> **Research doc**: See `latest-claude-research.md`

---

## Vercel Deployment

### Required Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string (pooled) |
| `DIRECT_URL` | ✅ | Neon direct connection (for migrations) |
| `AUTH_SECRET` | ✅ | Random 32+ char string for NextAuth. Generate: `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ✅ | Set to `true` for Vercel |
| `DATAFORSEO_LOGIN` | ✅ | DataForSEO API login |
| `DATAFORSEO_PASSWORD` | ✅ | DataForSEO API password |
| `SENTRY_DSN` | Optional | Sentry error tracking DSN |
| `SENTRY_ORG` | Optional | Sentry org slug (for source maps) |
| `SENTRY_PROJECT` | Optional | Sentry project slug (for source maps) |
| `SENTRY_AUTH_TOKEN` | Optional | Sentry auth token (for source maps) |
| `INNGEST_SIGNING_KEY` | Optional | For background jobs in production |
| `INNGEST_EVENT_KEY` | Optional | For background jobs in production |

### Creating a Test User

After deployment, create a user in the database:

```bash
# Run locally with production DATABASE_URL
DATABASE_URL="postgresql://..." npx tsx scripts/seed-user.ts
```

Or use the `/register` page directly.

**Test credentials** (after seeding):
- Email: `test@example.com`
- Password: `password123`

### Production URLs
- App: https://nk-seo-tool.vercel.app
- Login: https://nk-seo-tool.vercel.app/login
- Register: https://nk-seo-tool.vercel.app/register

---

## Project Overview

Dental practice SEO audit platform targeting 100-500 practices monthly with automated DataForSEO API integration. See `PROGRESS.md` for session history and `TODO.md` for detailed task checklists.

## Technology Stack

- **Framework**: Next.js 16.0.4 (App Router, TypeScript strict mode)
- **Database**: PostgreSQL 16 + TimescaleDB 2.17.1 (Neon)
- **ORM**: Prisma 6.19.0
- **Styling**: Tailwind CSS
- **Background Jobs**: Inngest
- **Error Tracking**: Sentry
- **Testing**: Vitest + Testing Library (818 tests passing)
- **Deployment**: Vercel
- **APIs**: DataForSEO v3

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # API routes (health, inngest, audits, auth, site-audit)
│   ├── (auth)/           # Login/register pages
│   └── (dashboard)/      # Dashboard pages (/, /audits, /site-audit, /local-seo, /gbp, /keyword-tracking)
├── components/           # React components
│   ├── audit/            # 22 audit visualization components
│   ├── site-audit/       # Site audit components (12+ including issues/)
│   ├── local-seo/        # Local SEO components (18 + 8 gbp-comparison)
│   ├── seo-audit/        # Keyword optimization audit components
│   ├── keyword-tracking/ # Keyword tracking components (9 files)
│   ├── charts/           # MetricChart, Sparkline
│   ├── layout/           # DashboardLayout, Sidebar, Header
│   ├── providers/        # ThemeProvider, SessionProvider
│   └── ui/               # 17+ shadcn/ui components
├── lib/                  # Utilities and services
│   ├── auth/             # NextAuth configuration
│   ├── dataforseo/       # DataForSEO API modules + caching
│   ├── db/               # Database operations (audit, keyword, site-audit, local-campaign, gbp-detailed, gbp-operations, keyword-tracking)
│   ├── inngest/          # Background job functions (audit, site-audit, keyword-tracking)
│   ├── google-places/    # Google Places API integration
│   ├── local-seo/        # Grid calculator, scanner, aggregator
│   ├── keywords/         # Keyword preset generation
│   └── constants/        # SEO thresholds configuration
└── types/                # TypeScript definitions (seo.ts, audit.ts)
```

## Database Schema

**Core tables**:
- `users`, `audits`, `audit_metrics` (TimescaleDB hypertable)
- `trackedKeywords`, `site_audit_scans`, `site_audit_summaries`, `site_audit_pages`
- `LocalCampaign`, `GridScan`, `GridPointResult`, `gbp_detailed_profiles`

**Domain architecture** (Phase 12):
- `domains`, `domain_settings`, `roi_calculations`
- `archived_audits`, `archived_site_audit_scans`, `archived_local_campaigns`

**Keyword tracking** (Phase 15+):
- `keyword_tracking_runs`, `keyword_tracking_results`, `keyword_tracking_schedules`
- Recent: `volume_date`, `keyword_difficulty` columns

## Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run test:run         # Run tests once
npm run seed:audit       # Seed test audit data
npx prisma studio        # Database GUI
npx prisma db push       # Sync schema (no migration)
npx inngest-cli@latest dev  # Start Inngest dev server
```

## Code Conventions

### TypeScript
- Strict mode ALWAYS enabled
- Explicit return types for functions
- No `any` types allowed
- Use interfaces over types for object shapes

### Prisma Decimal Fields
- **IMPORTANT**: Prisma returns `Decimal` as an object, not a JavaScript number
- Always convert with `Number()`: `onpageScore: page.onpage_score ? Number(page.onpage_score) : null`
- Affected fields: `onpage_score`, `avg_lcp`, `avg_cls`

### API Response Naming Convention
- **Database columns**: snake_case (PostgreSQL convention)
- **API responses**: camelCase (JavaScript/JSON convention)
- **Transform in**: Database operations layer (`src/lib/db/*.ts`)
- Example: DB column `started_at` → API response property `startedAt`

### API Routes Pattern
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await someOperation();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error message' }, { status: 500 });
  }
}
```

## Phase Status

| Phase | Status | Key Directory |
|-------|--------|---------------|
| 1 Foundation | ✅ | - |
| 2 DataForSEO | ✅ | src/lib/dataforseo/ |
| 3 Audit Engine | ✅ | src/lib/inngest/ |
| 4 Dashboard UI | ✅ | src/components/audit/ |
| 5 Auth | ✅ | src/lib/auth/ |
| 6 Enhanced Inputs | ✅ | src/lib/google-places/ |
| 7 OnPage Display | ✅ | src/components/audit/onpage/ |
| 8 Keywords | ✅ | src/lib/db/keyword-operations.ts |
| 9 Local SEO | ✅ | src/lib/local-seo/, src/components/local-seo/ |
| 10 Site Audit | ✅ | src/lib/db/site-audit-operations.ts, src/components/site-audit/ |
| 11 Competitor Dashboard | ✅ | src/components/competitors/ |
| 12 Domain-Centric | ✅ | src/contexts/DomainContext.tsx, src/lib/db/domain-operations.ts |
| 13 Calculators | ✅ | src/lib/calculators/ |
| 14 Keyword Audit | ✅ | src/lib/seo/, src/components/seo-audit/ |
| 15 Keyword Tracking | ✅ | src/lib/db/keyword-tracking-operations.ts |
| 16 Platform Redesign | ✅ | src/app/(dashboard)/d/[domainId]/ |

**All Phases Complete** ✅ (Phases 1-16)

---

## Quick Start

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Inngest
npx inngest-cli@latest dev

# Terminal 3: Seed data (optional)
npm run seed:audit
```

### Test Credentials
- **Email**: `test@example.com`
- **Password**: `password123`
- **Test Domain**: `fielderparkdental.com`

### Key URLs
- Health: `http://localhost:3000/api/health`
- Inngest: `http://localhost:8288`
- Dashboard: `http://localhost:3000`
- Domain view: `http://localhost:3000/d/[domainId]`

---

## Key Technical Notes

### DataForSEO OnPage API
- **Pages/Resources/Links**: Use POST with `id` in body, NOT GET with path params
- **tasks_ready**: 20 req/min rate limit (use polling with exponential backoff)
- **avgLcp/avgCls**: Calculated from pages data, not in Summary API

### Check Classification
- Issue severity defined in `src/lib/constants/seo-thresholds.ts` (`ISSUE_SEVERITY_CONFIG`)
- Checks classified as errors, warnings, or notices
- `NEGATIVE_CHECKS` set in PageDetailDrawer handles inverted check logic

### Local SEO Grid Rankings
- Coordinates must be `"lat,lng,zoom"` format with zoom 14
- `location_code`, `location_name`, `location_coordinate` are MUTUALLY EXCLUSIVE
- Default radius: 3 miles (optimized for dental practices)

### GBP Standalone Tool (Phase 18)
- **Access**: `/d/[domainId]/gbp` - works WITHOUT a Local SEO campaign
- **APIs**:
  - `/api/gbp/profile` - GET profile data
  - `/api/gbp/fetch?domainId=X` - POST to fetch basic info from DataForSEO
  - `/api/gbp/fetch?domainId=X&fetchDetailed=true` - POST to also fetch Posts, Q&A, Reviews
  - `/api/gbp/competitors` - GET/POST/DELETE competitors
  - `/api/gbp/import-from-grid` - POST to import from geo-grid scans
- **Database**:
  - `gbp_snapshots` - basic profile (rating, hours, attributes) - has `domain_id`
  - `gbp_detailed_profiles` - Posts, Q&A, Reviews - has `domain_id`
- **DataForSEO APIs Used**:
  - My Business Info: `work_time.work_hours.timetable`, `rating_distribution`, `attributes.available_attributes`
  - My Business Updates: Posts/Updates task-based API
  - Questions & Answers: Q&A task-based API
  - Reviews: Reviews task-based API
- **Operations**: `src/lib/db/gbp-operations.ts`, `src/lib/db/gbp-detailed-operations.ts`

### GBP Comparison Feature (Legacy - Campaign-based)
- **Access**: `/local-seo/[campaignId]/gbp-comparison` or "GBP Compare" button
- **Service**: `src/lib/local-seo/gbp-comparison.ts`
- **Components**: 8 files in `src/components/local-seo/gbp-comparison/`
- 6 tabs: Overview, Comparison, Gaps, Posts, Q&A, By Keyword

### Keyword Tracking Historical Fallback
- Google Ads blocks "dentist + city" keywords
- `getMostRecentVolume()` looks back through ALL historical months
- Stores `volume_date` to show data source age

### DataForSEO AI Optimization API
- **Client method**: `dataForSEOClient.post<T>(endpoint, body)` for raw API calls
- **Module**: `src/lib/dataforseo/modules/ai-optimization.ts`
- **Typed responses**: Use `DataForSEOResponse<T>` generic type
- **Endpoints used**:
  - `/v3/ai_optimization/llm_mentions/search/live` - LLM mentions search
  - `/v3/ai_optimization/llm_mentions/aggregated_metrics/live` - Aggregated metrics
  - `/v3/ai_optimization/llm_responses/chatgpt/live` - ChatGPT queries
  - `/v3/ai_optimization/llm_responses/google/live/advanced` - Google AI Overview
  - `/v3/ai_optimization/ai_keyword_data/search_volume/live` - AI keyword volume

### Auth Middleware
- **File**: `src/middleware.ts`
- **Pattern**: Check auth routes FIRST to prevent login loops
- **Protected routes**: `/`, `/d/*`, `/audits/*`, etc.
- **Auth routes**: `/login`, `/register` - excluded from protection
- **Session**: JWT-based via NextAuth v5

---

## Known Limitations

- **TimescaleDB Apache License**: Neon's TimescaleDB doesn't support compression/retention policies
- **Google Ads Keywords**: Policy blocks specific keyword data for "dentist + city" - use Historical API fallback
