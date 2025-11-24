# SEO Audit Platform - AI Assistant Context

**Last Updated**: 2025-11-24
**Phase**: Phase 1 Complete
**Tech Stack**: Next.js 15, TypeScript, Prisma, TimescaleDB

## Project Overview

Dental practice SEO audit platform targeting 100-500 practices monthly with automated DataForSEO API integration.

## Technology Stack

- **Framework**: Next.js 16.0.4 (App Router, TypeScript strict mode)
- **Database**: PostgreSQL 16 + TimescaleDB 2.17.1 (Neon)
- **ORM**: Prisma 6.19.0
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **APIs**: DataForSEO v3 (to be integrated in Phase 2)

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/
│   │   └── health/   # Health check endpoint
│   └── page.tsx      # Home page
├── components/       # React components (to be added)
├── features/         # Feature modules (to be added)
├── lib/              # Utilities and database client
│   ├── prisma.ts     # Database client singleton
│   └── db/           # Database helpers
│       └── timescale-helpers.ts
└── types/            # TypeScript type definitions (to be added)
```

## Database Schema

- **users**: User accounts
- **audits**: SEO audit records
- **audit_metrics**: Time-series metrics (TimescaleDB hypertable)

**Note**: The `audit_metrics` table uses a composite primary key `(id, recorded_at)` to support TimescaleDB's partitioning requirements.

## Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create migration
npx prisma generate      # Regenerate client
vercel --prod            # Deploy to production
```

## Code Conventions

### TypeScript

- Strict mode ALWAYS enabled
- Explicit return types for functions
- No `any` types allowed
- Use interfaces over types for object shapes

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Directories: `kebab-case/`
- API routes: `route.ts` in app directory

### Database

- Always import from `@/lib/prisma`
- Use pooled connection for runtime (`DATABASE_URL_POOLED`)
- Use unpooled for migrations (`DATABASE_URL` / `DIRECT_URL`)
- TimescaleDB queries use `time_bucket()` function

### API Routes Pattern

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    );
  }
}
```

## AI Assistant Rules

1. Always use TypeScript strict mode
2. Never use `any` types
3. Validate inputs with Zod schemas
4. Handle errors explicitly with try/catch
5. Return consistent API response format
6. Use Prisma client from @/lib/prisma
7. Never hardcode secrets or credentials
8. Test database operations before marking complete

## Phase 1 Status

- ✅ Next.js 16 initialized (with App Router)
- ✅ TypeScript strict mode enabled
- ✅ Prisma + TimescaleDB configured
- ✅ Database migrations applied (two-phase approach)
- ✅ Hypertable created for audit_metrics
- ✅ Deployed to Vercel
- ✅ Health check API working

## Known Limitations

- **TimescaleDB Apache License**: Neon's TimescaleDB uses Apache license which does NOT support:
  - Compression policies
  - Retention policies
  - Continuous aggregates

  For these features, consider Timescale Cloud or self-hosted with Timescale License.

## Next Phase Preview

Phase 2 will add:
- DataForSEO API client integration
- Background job processing with Inngest
- Dashboard UI components
- User authentication
