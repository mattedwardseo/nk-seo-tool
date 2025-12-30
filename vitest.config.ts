import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/dataforseo/**/*.ts'],
      exclude: [
        'node_modules/',
        'vitest.config.ts',
        'src/lib/dataforseo/**/*.test.ts',
        'src/lib/dataforseo/__tests__/**',
        'src/lib/dataforseo/**/index.ts',
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    // Timeout for async tests
    testTimeout: 10000,
    // Mock resolution
    mockReset: true,
    // Handle ESM packages that need to be inlined
    server: {
      deps: {
        inline: ['next-auth', '@auth/core', '@auth/prisma-adapter'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
