'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, X, Building2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Competitor {
  domain: string
  businessName?: string
  rank?: number
  isAutoDetected?: boolean
}

interface CompetitorSelectorProps {
  clientDomain: string
  competitors: Competitor[]
  maxCompetitors?: number
  onAdd?: (domain: string) => void
  onRemove?: (domain: string) => void
  isLoading?: boolean
  suggestedCompetitors?: Competitor[]
}

export function CompetitorSelector({
  clientDomain,
  competitors,
  maxCompetitors = 5,
  onAdd,
  onRemove,
  isLoading,
  suggestedCompetitors = [],
}: CompetitorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newDomain.trim()) {
      setError('Please enter a domain')
      return
    }

    // Basic domain validation
    const cleanDomain = newDomain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')

    if (!cleanDomain.includes('.')) {
      setError('Please enter a valid domain')
      return
    }

    if (competitors.some((c) => c.domain === cleanDomain)) {
      setError('Competitor already added')
      return
    }

    if (cleanDomain === clientDomain.replace(/^www\./, '')) {
      setError("Can't add your own domain")
      return
    }

    if (competitors.length >= maxCompetitors) {
      setError(`Maximum ${maxCompetitors} competitors allowed`)
      return
    }

    onAdd?.(cleanDomain)
    setNewDomain('')
    setError(null)
    setIsOpen(false)
  }

  const handleSuggestionClick = (domain: string) => {
    if (!competitors.some((c) => c.domain === domain)) {
      onAdd?.(domain)
    }
    setIsOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Competitors</span>
          <Badge variant="secondary" className="text-xs">
            {competitors.length}/{maxCompetitors}
          </Badge>
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={competitors.length >= maxCompetitors || isLoading}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Add Competitor</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="competitor.com"
                    value={newDomain}
                    onChange={(e) => {
                      setNewDomain(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className={cn(error && 'border-red-500')}
                  />
                  <Button onClick={handleAdd} disabled={!newDomain.trim()}>
                    Add
                  </Button>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>

              {/* Suggestions */}
              {suggestedCompetitors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Suggested competitors:
                  </p>
                  <div className="space-y-1">
                    {suggestedCompetitors
                      .filter((s) => !competitors.some((c) => c.domain === s.domain))
                      .slice(0, 3)
                      .map((suggestion) => (
                        <button
                          key={suggestion.domain}
                          onClick={() => handleSuggestionClick(suggestion.domain)}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        >
                          <span>{suggestion.domain}</span>
                          {suggestion.rank && (
                            <Badge variant="outline" className="text-xs">
                              Rank {suggestion.rank}
                            </Badge>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Client domain */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          Y
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{clientDomain}</p>
          <p className="text-xs text-muted-foreground">Your practice</p>
        </div>
      </div>

      {/* Competitor list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : competitors.length > 0 ? (
        <div className="space-y-2">
          {competitors.map((competitor, idx) => (
            <div
              key={competitor.domain}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                  idx === 0
                    ? 'bg-red-500'
                    : idx === 1
                      ? 'bg-amber-500'
                      : idx === 2
                        ? 'bg-purple-500'
                        : 'bg-gray-500'
                )}
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{competitor.domain}</p>
                {competitor.businessName && (
                  <p className="text-xs text-muted-foreground">{competitor.businessName}</p>
                )}
              </div>
              {competitor.isAutoDetected && (
                <Badge variant="secondary" className="text-xs">
                  Auto
                </Badge>
              )}
              {competitor.rank && (
                <Badge variant="outline" className="text-xs">
                  DR {competitor.rank}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRemove?.(competitor.domain)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No competitors added. Add competitors to see comparison data.
        </p>
      )}
    </div>
  )
}
