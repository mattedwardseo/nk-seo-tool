export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          SEO Audit Platform
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Next.js 15 + Prisma + TimescaleDB
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
            <h2 className="font-bold text-lg mb-2">Next.js 15</h2>
            <p className="text-sm text-gray-600">App Router + TypeScript</p>
          </div>
          <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
            <h2 className="font-bold text-lg mb-2">Prisma ORM</h2>
            <p className="text-sm text-gray-600">Type-safe database</p>
          </div>
          <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
            <h2 className="font-bold text-lg mb-2">TimescaleDB</h2>
            <p className="text-sm text-gray-600">Time-series optimized</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Check system health:
          </p>
          <a
            href="/api/health"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Health Check API
          </a>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs">
          <p>Phase 1 Foundation Complete</p>
          <p>Dental SEO Audit Platform</p>
        </div>
      </div>
    </main>
  );
}
