/**
 * Grid Calculator for Local SEO Map Rankings
 *
 * Generates GPS coordinates for a grid of points around a center location.
 * Uses the Haversine formula for accurate distance calculations on Earth's surface.
 */

/**
 * Earth's radius in miles
 */
const EARTH_RADIUS_MILES = 3958.8

/**
 * A single point in the grid
 */
export interface GridPoint {
  /** Row index (0 to gridSize-1) */
  row: number
  /** Column index (0 to gridSize-1) */
  col: number
  /** Latitude in decimal degrees */
  lat: number
  /** Longitude in decimal degrees */
  lng: number
}

/**
 * Configuration for grid generation
 */
export interface GridConfig {
  /** Center latitude of the grid */
  centerLat: number
  /** Center longitude of the grid */
  centerLng: number
  /** Number of rows/columns (e.g., 7 for 7x7 = 49 points) */
  gridSize: number
  /** Total radius from center to edge in miles */
  radiusMiles: number
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Converts radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * Calculates a new GPS coordinate given a starting point, bearing, and distance.
 * Uses the Haversine formula for accuracy on Earth's curved surface.
 *
 * @param lat - Starting latitude in degrees
 * @param lng - Starting longitude in degrees
 * @param bearing - Direction in degrees (0 = North, 90 = East, etc.)
 * @param distanceMiles - Distance to travel in miles
 * @returns New latitude and longitude
 */
export function calculateDestination(
  lat: number,
  lng: number,
  bearing: number,
  distanceMiles: number
): { lat: number; lng: number } {
  const lat1 = toRadians(lat)
  const lng1 = toRadians(lng)
  const bearingRad = toRadians(bearing)
  const angularDistance = distanceMiles / EARTH_RADIUS_MILES

  // Haversine formula for destination point
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  )

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    )

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  }
}

/**
 * Calculates the distance between two GPS coordinates using Haversine formula.
 *
 * @param lat1 - First point latitude
 * @param lng1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lng2 - Second point longitude
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const lat1Rad = toRadians(lat1)
  const lat2Rad = toRadians(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_MILES * c
}

/**
 * Generates a grid of GPS coordinates centered on a given location.
 *
 * The grid is created by calculating evenly-spaced points in a square pattern.
 * For a 7x7 grid with 5-mile radius:
 * - Total grid covers 10 miles × 10 miles
 * - Points are spaced ~1.67 miles apart (10 miles / 6 gaps)
 * - Center point is at position (3, 3)
 *
 * @example
 * ```ts
 * const points = generateGridPoints({
 *   centerLat: 32.7357,
 *   centerLng: -97.0891,
 *   gridSize: 7,
 *   radiusMiles: 5,
 * });
 * // Returns 49 GridPoint objects
 * ```
 */
export function generateGridPoints(config: GridConfig): GridPoint[] {
  const { centerLat, centerLng, gridSize, radiusMiles } = config

  // Validate inputs
  if (gridSize < 1 || gridSize > 15) {
    throw new Error('Grid size must be between 1 and 15')
  }
  if (radiusMiles <= 0 || radiusMiles > 50) {
    throw new Error('Radius must be between 0 and 50 miles')
  }

  const points: GridPoint[] = []

  // Total diameter of the grid
  const diameter = radiusMiles * 2

  // Space between points (diameter divided by number of gaps)
  const spacing = diameter / (gridSize - 1)

  // Calculate the top-left corner of the grid
  // Move North (bearing 0) by radius miles, then West (bearing 270) by radius miles
  const topLeft = calculateDestination(centerLat, centerLng, 0, radiusMiles) // Go North
  const topLeftCorner = calculateDestination(topLeft.lat, topLeft.lng, 270, radiusMiles) // Go West

  // Generate each row
  for (let row = 0; row < gridSize; row++) {
    // Calculate the starting point for this row (move South from top-left)
    const rowStart = calculateDestination(
      topLeftCorner.lat,
      topLeftCorner.lng,
      180, // South
      row * spacing
    )

    // Generate each column in this row
    for (let col = 0; col < gridSize; col++) {
      // Move East from row start
      const point = calculateDestination(
        rowStart.lat,
        rowStart.lng,
        90, // East
        col * spacing
      )

      points.push({
        row,
        col,
        lat: Number(point.lat.toFixed(7)),
        lng: Number(point.lng.toFixed(7)),
      })
    }
  }

  return points
}

/**
 * Gets the center point of a grid (useful for reference)
 */
export function getGridCenter(gridSize: number): { row: number; col: number } {
  const center = Math.floor(gridSize / 2)
  return { row: center, col: center }
}

/**
 * Checks if a point is at the center of the grid
 */
export function isGridCenter(point: GridPoint, gridSize: number): boolean {
  const center = getGridCenter(gridSize)
  return point.row === center.row && point.col === center.col
}

/**
 * Calculates statistics about a grid configuration
 */
export function getGridStats(config: GridConfig): {
  totalPoints: number
  diameter: number
  spacing: number
  centerIndex: number
} {
  const totalPoints = config.gridSize * config.gridSize
  const diameter = config.radiusMiles * 2
  const spacing = diameter / (config.gridSize - 1)
  const centerIndex = Math.floor(config.gridSize / 2)

  return {
    totalPoints,
    diameter,
    spacing: Number(spacing.toFixed(2)),
    centerIndex,
  }
}

/**
 * Formats a coordinate for use with DataForSEO API
 * Format: "lat,lng,zoom" with maximum 7 decimal places
 *
 * Per DataForSEO docs:
 * - zoom default: 17 (if not specified)
 * - zoom range: 3-21 for Google Maps, 4-18 for Local Finder
 *
 * Note: For geo-grid tracking, zoom 14-15 works better than 17 because:
 * - Zoom 17 is street-level and may return 0 results in residential/empty areas
 * - Zoom 14-15 covers ~1-2 mile radius which matches typical grid spacing
 * - This aligns with how tools like BrightLocal/LocalViking work
 */
export function formatCoordinateForApi(lat: number, lng: number, zoom: number = 14): string {
  return `${lat.toFixed(7)},${lng.toFixed(7)},${zoom}`
}

/**
 * Converts grid points to a format suitable for batch API requests
 */
export function gridPointsToApiFormat(
  points: GridPoint[]
): Array<{ row: number; col: number; coordinates: string }> {
  return points.map((point) => ({
    row: point.row,
    col: point.col,
    coordinates: formatCoordinateForApi(point.lat, point.lng),
  }))
}
