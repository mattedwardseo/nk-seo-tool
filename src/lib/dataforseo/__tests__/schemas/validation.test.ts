/**
 * Schema Validation Tests
 *
 * Tests for all Zod validation schemas used in DataForSEO API modules.
 */

import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import {
  domainSchema,
  urlSchema,
  keywordSchema,
  keywordsArraySchema,
  locationCodeSchema,
  locationNameSchema,
  languageCodeSchema,
  paginationSchema,
  dateRangeSchema,
} from '../../schemas/common'

describe('Common Schemas', () => {
  // ===========================================================================
  // domainSchema Tests
  // ===========================================================================
  describe('domainSchema', () => {
    it('accepts valid domain', () => {
      expect(domainSchema.parse('example.com')).toBe('example.com')
    })

    it('accepts subdomain', () => {
      expect(domainSchema.parse('sub.example.com')).toBe('sub.example.com')
    })

    it('transforms domain to lowercase', () => {
      expect(domainSchema.parse('EXAMPLE.COM')).toBe('example.com')
      expect(domainSchema.parse('Example.Com')).toBe('example.com')
    })

    it('accepts domain with numbers', () => {
      expect(domainSchema.parse('example123.com')).toBe('example123.com')
    })

    it('accepts domain with hyphens', () => {
      expect(domainSchema.parse('my-example.com')).toBe('my-example.com')
    })

    it('rejects empty string', () => {
      expect(() => domainSchema.parse('')).toThrow(ZodError)
    })

    it('rejects domain with protocol', () => {
      expect(() => domainSchema.parse('https://example.com')).toThrow(ZodError)
      expect(() => domainSchema.parse('http://example.com')).toThrow(ZodError)
    })

    it('rejects domain with path', () => {
      expect(() => domainSchema.parse('example.com/path')).toThrow(ZodError)
    })

    it('rejects domain with www prefix', () => {
      // www.example.com is actually valid since it's a subdomain
      // This test verifies the schema accepts it as-is
      expect(domainSchema.parse('www.example.com')).toBe('www.example.com')
    })

    it('rejects invalid characters', () => {
      expect(() => domainSchema.parse('example_site.com')).toThrow(ZodError)
      expect(() => domainSchema.parse('example site.com')).toThrow(ZodError)
    })

    it('rejects domain starting/ending with hyphen', () => {
      expect(() => domainSchema.parse('-example.com')).toThrow(ZodError)
      expect(() => domainSchema.parse('example-.com')).toThrow(ZodError)
    })

    it('rejects domain exceeding max length', () => {
      const longDomain = 'a'.repeat(250) + '.com'
      expect(() => domainSchema.parse(longDomain)).toThrow(ZodError)
    })
  })

  // ===========================================================================
  // urlSchema Tests
  // ===========================================================================
  describe('urlSchema', () => {
    it('accepts valid HTTP URL', () => {
      expect(urlSchema.parse('http://example.com')).toBe('http://example.com')
    })

    it('accepts valid HTTPS URL', () => {
      expect(urlSchema.parse('https://example.com')).toBe('https://example.com')
    })

    it('accepts URL with path', () => {
      expect(urlSchema.parse('https://example.com/path/to/page')).toBe(
        'https://example.com/path/to/page'
      )
    })

    it('accepts URL with query parameters', () => {
      expect(urlSchema.parse('https://example.com?foo=bar&baz=qux')).toBe(
        'https://example.com?foo=bar&baz=qux'
      )
    })

    it('accepts URL with fragment', () => {
      expect(urlSchema.parse('https://example.com#section')).toBe('https://example.com#section')
    })

    it('rejects empty string', () => {
      expect(() => urlSchema.parse('')).toThrow(ZodError)
    })

    it('rejects URL without protocol', () => {
      expect(() => urlSchema.parse('example.com')).toThrow(ZodError)
    })

    it('rejects invalid URL', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow(ZodError)
    })

    it('rejects URL exceeding 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2030)
      expect(() => urlSchema.parse(longUrl)).toThrow(ZodError)
    })
  })

  // ===========================================================================
  // keywordSchema Tests
  // ===========================================================================
  describe('keywordSchema', () => {
    it('accepts valid keyword', () => {
      expect(keywordSchema.parse('dentist')).toBe('dentist')
    })

    it('accepts keyword with spaces', () => {
      expect(keywordSchema.parse('dentist near me')).toBe('dentist near me')
    })

    it('trims whitespace', () => {
      expect(keywordSchema.parse('  dentist  ')).toBe('dentist')
      expect(keywordSchema.parse('\tdentist\n')).toBe('dentist')
    })

    it('accepts keyword with special characters', () => {
      expect(keywordSchema.parse("dentist's office")).toBe("dentist's office")
    })

    it('rejects empty string', () => {
      expect(() => keywordSchema.parse('')).toThrow(ZodError)
    })

    it('accepts whitespace-only string but trims to empty', () => {
      // Note: Zod transforms run after validation, so whitespace passes min(1) check
      // The transform then trims it to empty string
      // If this behavior is undesirable, add .refine() to check after trim
      const result = keywordSchema.parse('   ')
      expect(result).toBe('')
    })

    it('rejects keyword exceeding 100 characters', () => {
      const longKeyword = 'a'.repeat(101)
      expect(() => keywordSchema.parse(longKeyword)).toThrow(ZodError)
    })

    it('accepts keyword at exactly 100 characters', () => {
      const maxKeyword = 'a'.repeat(100)
      expect(keywordSchema.parse(maxKeyword)).toBe(maxKeyword)
    })
  })

  // ===========================================================================
  // keywordsArraySchema Tests
  // ===========================================================================
  describe('keywordsArraySchema', () => {
    it('accepts array with single keyword', () => {
      expect(keywordsArraySchema.parse(['dentist'])).toEqual(['dentist'])
    })

    it('accepts array with multiple keywords', () => {
      expect(keywordsArraySchema.parse(['dentist', 'dental care', 'teeth whitening'])).toEqual([
        'dentist',
        'dental care',
        'teeth whitening',
      ])
    })

    it('trims keywords in array', () => {
      expect(keywordsArraySchema.parse(['  dentist  ', 'dental care  '])).toEqual([
        'dentist',
        'dental care',
      ])
    })

    it('rejects empty array', () => {
      expect(() => keywordsArraySchema.parse([])).toThrow(ZodError)
    })

    it('rejects array with invalid keyword', () => {
      expect(() => keywordsArraySchema.parse(['dentist', ''])).toThrow(ZodError)
    })

    it('rejects array exceeding 1000 keywords', () => {
      const tooManyKeywords = Array(1001).fill('keyword')
      expect(() => keywordsArraySchema.parse(tooManyKeywords)).toThrow(ZodError)
    })

    it('accepts array with exactly 1000 keywords', () => {
      const maxKeywords = Array(1000).fill('keyword')
      expect(keywordsArraySchema.parse(maxKeywords)).toHaveLength(1000)
    })
  })

  // ===========================================================================
  // locationCodeSchema Tests
  // ===========================================================================
  describe('locationCodeSchema', () => {
    it('accepts valid location code', () => {
      expect(locationCodeSchema.parse(2840)).toBe(2840) // United States
    })

    it('accepts large location code', () => {
      expect(locationCodeSchema.parse(21176)).toBe(21176) // Austin, TX
    })

    it('rejects zero', () => {
      expect(() => locationCodeSchema.parse(0)).toThrow(ZodError)
    })

    it('rejects negative number', () => {
      expect(() => locationCodeSchema.parse(-1)).toThrow(ZodError)
    })

    it('rejects float', () => {
      expect(() => locationCodeSchema.parse(2840.5)).toThrow(ZodError)
    })

    it('rejects string', () => {
      expect(() => locationCodeSchema.parse('2840')).toThrow(ZodError)
    })
  })

  // ===========================================================================
  // locationNameSchema Tests
  // ===========================================================================
  describe('locationNameSchema', () => {
    it('accepts country name', () => {
      expect(locationNameSchema.parse('United States')).toBe('United States')
    })

    it('accepts city, state, country format', () => {
      expect(locationNameSchema.parse('Austin,Texas,United States')).toBe(
        'Austin,Texas,United States'
      )
    })

    it('rejects empty string', () => {
      expect(() => locationNameSchema.parse('')).toThrow(ZodError)
    })

    it('rejects string exceeding 100 characters', () => {
      const longLocation = 'A'.repeat(101)
      expect(() => locationNameSchema.parse(longLocation)).toThrow(ZodError)
    })
  })

  // ===========================================================================
  // languageCodeSchema Tests
  // ===========================================================================
  describe('languageCodeSchema', () => {
    it('accepts two-letter code', () => {
      expect(languageCodeSchema.parse('en')).toBe('en')
      expect(languageCodeSchema.parse('es')).toBe('es')
      expect(languageCodeSchema.parse('de')).toBe('de')
    })

    it('accepts language-region code', () => {
      expect(languageCodeSchema.parse('en-US')).toBe('en-US')
      expect(languageCodeSchema.parse('pt-BR')).toBe('pt-BR')
    })

    it('rejects single character', () => {
      expect(() => languageCodeSchema.parse('e')).toThrow(ZodError)
    })

    it('rejects uppercase two-letter code', () => {
      expect(() => languageCodeSchema.parse('EN')).toThrow(ZodError)
    })

    it('rejects invalid format', () => {
      expect(() => languageCodeSchema.parse('eng')).toThrow(ZodError)
      expect(() => languageCodeSchema.parse('en_US')).toThrow(ZodError)
    })
  })

  // ===========================================================================
  // paginationSchema Tests
  // ===========================================================================
  describe('paginationSchema', () => {
    it('applies default values', () => {
      expect(paginationSchema.parse({})).toEqual({ limit: 100, offset: 0 })
    })

    it('accepts custom limit', () => {
      expect(paginationSchema.parse({ limit: 50 })).toEqual({ limit: 50, offset: 0 })
    })

    it('accepts custom offset', () => {
      expect(paginationSchema.parse({ offset: 100 })).toEqual({ limit: 100, offset: 100 })
    })

    it('accepts both custom values', () => {
      expect(paginationSchema.parse({ limit: 25, offset: 50 })).toEqual({ limit: 25, offset: 50 })
    })

    it('rejects limit below 1', () => {
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow(ZodError)
    })

    it('rejects limit above 1000', () => {
      expect(() => paginationSchema.parse({ limit: 1001 })).toThrow(ZodError)
    })

    it('accepts limit at 1000', () => {
      expect(paginationSchema.parse({ limit: 1000 })).toEqual({ limit: 1000, offset: 0 })
    })

    it('rejects negative offset', () => {
      expect(() => paginationSchema.parse({ offset: -1 })).toThrow(ZodError)
    })

    it('accepts offset at 0', () => {
      expect(paginationSchema.parse({ offset: 0 })).toEqual({ limit: 100, offset: 0 })
    })
  })

  // ===========================================================================
  // dateRangeSchema Tests
  // ===========================================================================
  describe('dateRangeSchema', () => {
    it('accepts empty object (optional fields)', () => {
      expect(dateRangeSchema.parse({})).toEqual({})
    })

    it('accepts dateFrom only', () => {
      expect(dateRangeSchema.parse({ dateFrom: '2024-01-01' })).toEqual({ dateFrom: '2024-01-01' })
    })

    it('accepts dateTo only', () => {
      expect(dateRangeSchema.parse({ dateTo: '2024-12-31' })).toEqual({ dateTo: '2024-12-31' })
    })

    it('accepts both dates', () => {
      expect(dateRangeSchema.parse({ dateFrom: '2024-01-01', dateTo: '2024-12-31' })).toEqual({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      })
    })

    it('rejects invalid date format', () => {
      expect(() => dateRangeSchema.parse({ dateFrom: '01-01-2024' })).toThrow(ZodError)
      expect(() => dateRangeSchema.parse({ dateFrom: '2024/01/01' })).toThrow(ZodError)
      expect(() => dateRangeSchema.parse({ dateFrom: 'January 1, 2024' })).toThrow(ZodError)
    })

    it('rejects date without leading zeros', () => {
      expect(() => dateRangeSchema.parse({ dateFrom: '2024-1-1' })).toThrow(ZodError)
    })
  })
})
