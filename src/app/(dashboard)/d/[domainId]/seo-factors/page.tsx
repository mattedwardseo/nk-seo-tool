'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDomain } from '@/contexts/DomainContext'
import {
  TOP_200_FACTORS,
  SEO_FACTOR_TYPES,
  getFactorsGroupedByType,
  getLocalSEOFactors,
  getDentalPracticeSEOTips,
  type SEOFactor,
  type SEOFactorType,
} from '@/lib/seo-factors/top-200-factors'

const typeColors: Record<string, string> = {
  Diversity: 'bg-violet-500',
  Relevancy: 'bg-blue-500',
  Authority: 'bg-emerald-500',
  Performance: 'bg-amber-500',
  Size: 'bg-cyan-500',
  Technology: 'bg-pink-500',
  Trust: 'bg-green-500',
  Other: 'bg-slate-500',
  Untyped: 'bg-gray-500',
}

const typeBadgeColors: Record<string, string> = {
  Diversity: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  Relevancy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  Authority: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  Performance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  Size: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  Technology: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  Trust: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  Other: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
  Untyped: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
}

export default function SEOFactorsPage() {
  useParams() // For route validation
  useDomain() // For context
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null)
  const [showCount, setShowCount] = useState(50)

  const factorsByType = useMemo(() => getFactorsGroupedByType(), [])
  const localFactors = useMemo(() => getLocalSEOFactors(), [])
  const dentalTips = useMemo(() => getDentalPracticeSEOTips(), [])

  const filteredFactors = useMemo(() => {
    let factors = TOP_200_FACTORS

    if (selectedType !== 'all') {
      factors = factors.filter(f => f.type === selectedType)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      factors = factors.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.factorId.toLowerCase().includes(query)
      )
    }

    return factors.slice(0, showCount)
  }, [selectedType, searchQuery, showCount])

  const typeStats = useMemo(() => {
    return Object.entries(factorsByType)
      .filter(([type]) => type !== 'Untyped')
      .map(([type, factors]) => ({
        type,
        count: factors.length,
        avgCorrelation: factors.reduce((sum, f) => sum + f.correlation, 0) / factors.length,
      }))
      .sort((a, b) => a.avgCorrelation - b.avgCorrelation)
  }, [factorsByType])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Layers className="h-5 w-5 text-violet-500" />
            </div>
            SEO Ranking Factors
            <Badge className="bg-[#FF6B35] text-white ml-2">NEW</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Top 200 SEO factors based on Cora SEO Software community data
          </p>
        </div>
      </div>

      {/* About Card */}
      <Card className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <BarChart3 className="h-6 w-6 text-violet-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Understanding the Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This data comes from the Cora SEO Software community. Correlation coefficients range from -1 to +1, 
                where values closer to -1 indicate stronger positive correlation with rankings. 
                Use these factors as a guide for optimizing your pages.
              </p>
              <div className="flex flex-wrap gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>#1 Max: Best value found in position 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Page 1 Avg: Average across page 1 results</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Usage %: Top 100 sites using this factor</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Factors</TabsTrigger>
          <TabsTrigger value="local">Local SEO</TabsTrigger>
          <TabsTrigger value="dental">Dental Tips</TabsTrigger>
          <TabsTrigger value="stats">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search factors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SEO_FACTOR_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${typeColors[type]}`} />
                      {type}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Factors List */}
          <Card>
            <CardHeader>
              <CardTitle>Top SEO Ranking Factors</CardTitle>
              <CardDescription>
                Showing {filteredFactors.length} of {selectedType === 'all' ? TOP_200_FACTORS.length : factorsByType[selectedType as SEOFactorType]?.length || 0} factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredFactors.map((factor) => (
                  <FactorRow
                    key={factor.rank}
                    factor={factor}
                    isExpanded={expandedFactor === factor.rank}
                    onToggle={() => setExpandedFactor(expandedFactor === factor.rank ? null : factor.rank)}
                  />
                ))}
              </div>

              {showCount < TOP_200_FACTORS.length && selectedType === 'all' && !searchQuery && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCount(prev => Math.min(prev + 50, 200))}
                  >
                    Load More ({Math.min(showCount + 50, 200)} of 200)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Local SEO Relevant Factors
              </CardTitle>
              <CardDescription>
                These factors are particularly important for local dental practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {localFactors.map((factor) => (
                  <FactorRow
                    key={factor.rank}
                    factor={factor}
                    isExpanded={expandedFactor === factor.rank}
                    onToggle={() => setExpandedFactor(expandedFactor === factor.rank ? null : factor.rank)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dental" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Dental Practice SEO Tips
              </CardTitle>
              <CardDescription>
                Actionable recommendations based on top ranking factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dentalTips.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold">
                        #{item.factor.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.factor.name}</h4>
                          {item.factor.type && (
                            <Badge className={typeBadgeColors[item.factor.type]}>
                              {item.factor.type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Correlation: {item.factor.correlation} | Usage: {item.factor.usagePercent}%
                        </p>
                        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            💡 {item.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {typeStats.slice(0, 8).map(({ type, count, avgCorrelation }) => (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={typeBadgeColors[type]}>{type}</Badge>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Correlation</span>
                      <span className="font-medium">{avgCorrelation.toFixed(3)}</span>
                    </div>
                    <Progress 
                      value={Math.abs(avgCorrelation) * 500}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Factor Distribution by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typeStats.map(({ type, count }) => (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-24">
                      <Badge className={typeBadgeColors[type]}>{type}</Badge>
                    </div>
                    <div className="flex-1">
                      <Progress value={(count / 50) * 100} className="h-3" />
                    </div>
                    <div className="w-12 text-right font-medium tabular-nums">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Factor Row Component
function FactorRow({ 
  factor, 
  isExpanded, 
  onToggle 
}: { 
  factor: SEOFactor
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`rounded-lg border transition-all ${
        isExpanded ? 'bg-muted/30 shadow-sm' : 'hover:bg-muted/20'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
          {factor.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{factor.name}</span>
            {factor.type && (
              <Badge className={`${typeBadgeColors[factor.type]} text-xs`}>
                {factor.type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>Corr: {factor.correlation}</span>
            <span>Usage: {factor.usagePercent}%</span>
            <span>Searches: {factor.searchesPercent}%</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t pt-4 ml-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="text-center p-3 rounded-md bg-background">
              <div className="text-xs text-muted-foreground mb-1">#1 Max</div>
              <div className="text-lg font-bold">{factor.maxValue}</div>
            </div>
            <div className="text-center p-3 rounded-md bg-background">
              <div className="text-xs text-muted-foreground mb-1">Page 1 Avg</div>
              <div className="text-lg font-bold">{factor.page1Avg}</div>
            </div>
            <div className="text-center p-3 rounded-md bg-background">
              <div className="text-xs text-muted-foreground mb-1">Usage %</div>
              <div className="text-lg font-bold">{factor.usagePercent}%</div>
            </div>
            <div className="text-center p-3 rounded-md bg-background">
              <div className="text-xs text-muted-foreground mb-1">Correlation</div>
              <div className="text-lg font-bold">{factor.correlation}</div>
            </div>
          </div>

          {factor.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {factor.description}
            </p>
          )}

          {factor.recommendation && (
            <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                <strong>Recommendation:</strong> {factor.recommendation}
              </p>
            </div>
          )}

          <a
            href={factor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
          >
            Learn more about this factor
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  )
}

