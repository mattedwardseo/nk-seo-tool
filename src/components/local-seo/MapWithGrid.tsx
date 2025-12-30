'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GridCellData } from './GridCell'

// Fix for default marker icons in Leaflet with webpack
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Red marker for the business center
const centerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

interface GridMapPoint {
  row: number
  col: number
  lat: number
  lng: number
  rank: number | null
  keyword?: string
  keywords?: Array<{
    keyword: string
    rank: number | null
    topRankings?: unknown[]
  }>
  avgRank?: number | null
  topRankings?: Array<{
    name: string
    rank: number
    cid?: string
    rating?: number
    reviewCount?: number
    category?: string
  }>
}

interface MapWithGridProps {
  points: GridMapPoint[]
  gridSize: number
  centerLat: number
  centerLng: number
  targetBusinessName?: string
  radiusMiles?: number
  selectedKeyword?: string
  onPointClick?: (point: GridCellData) => void
}

// Get color based on rank
function getRankColor(rank: number | null | undefined): string {
  if (rank === null || rank === undefined) return '#ef4444' // red - not ranking
  if (rank <= 3) return '#22c55e' // green - top 3
  if (rank <= 10) return '#eab308' // yellow - 4-10
  if (rank <= 20) return '#f97316' // orange - 11-20
  return '#ef4444' // red - 20+
}

// Get display text for rank (full precision for popups)
function getRankDisplay(rank: number | null, avgRank?: number | null): string {
  const displayRank = avgRank !== undefined && avgRank !== null ? avgRank : rank
  if (displayRank === null || displayRank === undefined) return '20+'
  if (displayRank > 20) return '20+'
  return displayRank.toFixed(avgRank !== undefined && avgRank !== null ? 1 : 0)
}

// Get short display for circle (integer only)
function getShortRankDisplay(rank: number | null | undefined, avgRank?: number | null): string {
  const displayRank = avgRank !== undefined && avgRank !== null ? avgRank : rank
  if (displayRank === null || displayRank === undefined) return '20'
  if (displayRank > 20) return '20'
  return Math.floor(displayRank).toString()
}

// Create a custom div icon with the rank number
function createRankIcon(rank: number | null | undefined, avgRank: number | null | undefined, isCenter: boolean): L.DivIcon {
  const effectiveRank = avgRank !== undefined && avgRank !== null ? avgRank : rank
  const color = getRankColor(effectiveRank)
  const shortRank = getShortRankDisplay(rank, avgRank)
  const size = isCenter ? 28 : 24
  const fontSize = shortRank.length > 1 ? 10 : 12

  return L.divIcon({
    className: 'custom-rank-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${isCenter ? '3px solid #3b82f6' : '2px solid white'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${fontSize}px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      ">${shortRank}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// Component to fit map bounds
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }): null {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [20, 20] })
  }, [map, bounds])
  return null
}

export function MapWithGrid({
  points,
  gridSize,
  centerLat,
  centerLng,
  targetBusinessName = 'Target Business',
  radiusMiles = 5,
  onPointClick,
}: MapWithGridProps): React.ReactElement {
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Convert miles to degrees (approximate)
  const radiusInDegrees = radiusMiles / 69 // ~69 miles per degree of latitude

  // Calculate bounds
  const bounds: L.LatLngBoundsExpression = [
    [centerLat - radiusInDegrees * 1.2, centerLng - radiusInDegrees * 1.2],
    [centerLat + radiusInDegrees * 1.2, centerLng + radiusInDegrees * 1.2],
  ]

  const handlePointClick = (point: GridMapPoint): void => {
    if (onPointClick) {
      onPointClick({
        row: point.row,
        col: point.col,
        lat: point.lat,
        lng: point.lng,
        rank: point.rank,
        keyword: point.keyword,
        keywords: point.keywords,
        avgRank: point.avgRank,
        topRankings: point.topRankings,
      })
    }
  }

  const centerRow = Math.floor(gridSize / 2)
  const centerCol = Math.floor(gridSize / 2)

  if (!isClient) {
    return (
      <div className="w-full h-[500px] bg-muted/30 rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        ref={mapRef}
        center={[centerLat, centerLng]}
        zoom={12}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds bounds={bounds} />

        {/* Center marker for the business */}
        <Marker position={[centerLat, centerLng]} icon={centerIcon}>
          <Popup>
            <div className="font-semibold">{targetBusinessName}</div>
            <div className="text-xs text-gray-500">Business Location (Center)</div>
          </Popup>
        </Marker>

        {/* Grid point markers */}
        {points.map((point) => {
          const isCenter = point.row === centerRow && point.col === centerCol
          const effectiveRank = point.avgRank !== undefined && point.avgRank !== null
            ? point.avgRank
            : point.rank
          const color = getRankColor(effectiveRank)
          const rankDisplay = getRankDisplay(point.rank ?? null, point.avgRank)
          const icon = createRankIcon(point.rank, point.avgRank, isCenter)

          return (
            <Marker
              key={`${point.row}-${point.col}`}
              position={[point.lat, point.lng]}
              icon={icon}
              eventHandlers={{
                click: () => handlePointClick(point),
              }}
            >
              <Popup>
                <div className="min-w-[150px]">
                  <div className="font-semibold mb-1">
                    Grid Point ({point.row + 1}, {point.col + 1})
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-sm"
                      style={{ backgroundColor: color }}
                    >
                      {rankDisplay}
                    </span>
                    <span className="text-sm">
                      {point.rank !== null ? `Rank #${point.rank}` : 'Not Ranking'}
                    </span>
                  </div>
                  {point.keyword && (
                    <div className="text-xs text-gray-600">
                      Keyword: {point.keyword}
                    </div>
                  )}
                  {point.topRankings && point.topRankings.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs font-medium mb-1">Top 3:</div>
                      {point.topRankings.slice(0, 3).map((r, i) => (
                        <div key={i} className="text-xs text-gray-600 truncate">
                          {r.rank}. {r.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-medium mb-2">Rank Legend</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs">1-3</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">4-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs">11-20</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs">20+</span>
          </div>
        </div>
      </div>

      {/* Business marker indicator */}
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-lg px-3 py-2 z-[1000] flex items-center gap-2">
        <div className="w-4 h-6 relative">
          <svg viewBox="0 0 24 36" className="w-full h-full">
            <path
              d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
              fill="#ef4444"
            />
          </svg>
        </div>
        <span className="text-xs font-medium">{targetBusinessName}</span>
      </div>
    </div>
  )
}
