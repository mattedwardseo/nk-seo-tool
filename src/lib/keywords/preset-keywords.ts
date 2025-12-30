/**
 * Preset Dental Keyword Templates
 *
 * These templates use placeholders that get replaced with city/state:
 * - {city} = city name lowercase (e.g., "philadelphia")
 * - {state} = state abbreviation lowercase (e.g., "pa")
 * - {state_full} = full state name lowercase (e.g., "pennsylvania")
 */

/**
 * Map of US state abbreviations to full state names (lowercase)
 */
export const STATE_MAP: Record<string, string> = {
  AL: 'alabama',
  AK: 'alaska',
  AZ: 'arizona',
  AR: 'arkansas',
  CA: 'california',
  CO: 'colorado',
  CT: 'connecticut',
  DE: 'delaware',
  DC: 'district of columbia',
  FL: 'florida',
  GA: 'georgia',
  HI: 'hawaii',
  ID: 'idaho',
  IL: 'illinois',
  IN: 'indiana',
  IA: 'iowa',
  KS: 'kansas',
  KY: 'kentucky',
  LA: 'louisiana',
  ME: 'maine',
  MD: 'maryland',
  MA: 'massachusetts',
  MI: 'michigan',
  MN: 'minnesota',
  MS: 'mississippi',
  MO: 'missouri',
  MT: 'montana',
  NE: 'nebraska',
  NV: 'nevada',
  NH: 'new hampshire',
  NJ: 'new jersey',
  NM: 'new mexico',
  NY: 'new york',
  NC: 'north carolina',
  ND: 'north dakota',
  OH: 'ohio',
  OK: 'oklahoma',
  OR: 'oregon',
  PA: 'pennsylvania',
  RI: 'rhode island',
  SC: 'south carolina',
  SD: 'south dakota',
  TN: 'tennessee',
  TX: 'texas',
  UT: 'utah',
  VT: 'vermont',
  VA: 'virginia',
  WA: 'washington',
  WV: 'west virginia',
  WI: 'wisconsin',
  WY: 'wyoming',
}

/**
 * US States dropdown options
 */
export const US_STATES = Object.entries(STATE_MAP).map(([abbrev, full]) => ({
  value: abbrev,
  label: `${abbrev} - ${full.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
}))

/**
 * Dental keyword templates with placeholders
 * Pattern 1: {keyword} {city}
 * Pattern 2: {keyword} {city} {state}
 * Pattern 3: {keyword} {city} {state_full}
 * Pattern 4: Special cases
 */
export const DENTAL_KEYWORD_TEMPLATES: string[] = [
  // Pattern 1: {keyword} {city} - 62 templates
  'dentist {city}',
  'orthodontist {city}',
  'emergency dentist {city}',
  'pediatric dentist {city}',
  'dental implants {city}',
  '{city} dentist',
  '{city} dentists',
  'dentist in {city}',
  'dentists in {city}',
  'dentists {city}',
  'teeth whitening {city}',
  'invisalign {city}',
  'endodontist {city}',
  '{city} orthodontist',
  'best dentist {city}',
  'veneers {city}',
  'pediatric dentist in {city}',
  'whitening teeth {city}',
  '24 hour emergency dentist {city}',
  'braces {city}',
  'wisdom teeth removal {city}',
  'dentist near me {city}',
  '{city} orthodontists',
  'all on 4 dental implants {city}',
  'teeth in a day {city}',
  'dental implants in {city}',
  '{city} dental implants',
  'dental office {city}',
  '{city} emergency dentist',
  'dental clinic {city}',
  'dental {city}',
  'emergency dental care {city}',
  'emergency dental {city}',
  'porcelain veneers {city}',
  'childrens dentist {city}',
  '{city} pediatric dentistry',
  'root canal {city}',
  '{city} invisalign',
  'cosmetic dentist in {city}',
  'dentist office {city}',
  '{city} cosmetic dentist',
  'dental veneers {city}',
  'wisdom teeth extraction {city}',
  'dental insurance {city}',
  'cosmetic dentistry in {city}',
  'natural dentist {city}',
  'kids dentist {city}',
  'invisalign in {city}',
  'implant supported dentures {city}',
  'best dental implants {city}',
  'oral surgeons {city}',
  'tooth extraction {city}',
  'dental cleaning {city}',
  'teeth cleaning {city}',
  'dental bridges {city}',
  'dental crown {city}',
  'dental crowns {city}',
  'dentist {city} near me',
  '{city} porcelain veneers',
  'emergency root canal {city}',
  'dental clinics in {city}',

  // Pattern 2: {keyword} {city} {state} - 19 templates
  'dentist {city} {state}',
  'dental implants {city} {state}',
  'emergency dentist in {city} {state}',
  'orthodontist in {city} {state}',
  'dentist in {city} {state}',
  'dental {city} {state}',
  'oral surgeon {city} {state}',
  'teeth whitening {city} {state}',
  'invisalign {city} {state}',
  'dentist office {city} {state}',
  'endodontist {city} {state}',
  'best dentist in {city} {state}',
  'dental implants in {city} {state}',
  'dental crowns {city} {state}',
  'dental insurance {city} {state}',
  'cosmetic dentist {city} {state}',
  'emergency dentist {city} {state}',
  'dentists {city} {state}',
  'cosmetic dentistry {city} {state}',

  // Pattern 3: {keyword} {city} {state_full} - 1 template
  'dentist in {city} {state_full}',

  // Pattern 4: Special cases - 1 template
  'emergency dentist {city} medicaid',
]

/**
 * Generate keywords from templates for a specific city/state
 *
 * @param city - City name (will be lowercased)
 * @param stateAbbrev - State abbreviation (e.g., "TX", "PA")
 * @returns Array of generated keywords (all lowercase)
 */
export function generateKeywordsForLocation(city: string, stateAbbrev: string): string[] {
  const cityLower = city.toLowerCase().trim()
  const stateLower = stateAbbrev.toLowerCase().trim()
  const stateFullLower = STATE_MAP[stateAbbrev.toUpperCase()] || stateLower

  return DENTAL_KEYWORD_TEMPLATES.map((template) =>
    template
      .replace(/{city}/g, cityLower)
      .replace(/{state}/g, stateLower)
      .replace(/{state_full}/g, stateFullLower)
  )
}

/**
 * Get the number of keyword templates
 */
export const KEYWORD_TEMPLATE_COUNT = DENTAL_KEYWORD_TEMPLATES.length // 85
