'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDomain } from '@/contexts/DomainContext'

interface AnalysisCheck {
  id: string
  label: string
  description: string
  weight: 'high' | 'medium' | 'low'
  passed: boolean
  currentValue: string | number | boolean | null
  recommendedValue: string | number | boolean | null
  recommendation?: string
}

interface GBPAnalysis {
  id: string
  score: number
  checks: AnalysisCheck[]
  recommendations: string[]
  quickWins: string[]
  competitorAvgScore: number | null
  analyzedAt: string
  profile: {
    businessName: string
    rating: number | null
    reviewCount: number | null
  }
}

export default function GBPAnalysisPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [analysis, setAnalysis] = useState<GBPAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cityName, setCityName] = useState('')

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }
    fetchAnalysis()
  }, [domainId])

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gbp/analysis?domainId=${domainId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setAnalysis(data.data)
      }
    } catch {
      // No analysis yet is OK
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    if (!cityName.trim()) {
      setError('Please enter the city name for analysis')
      return
    }

    setRunning(true)
    setError(null)

    try {
      const response = await fetch(`/api/gbp/analysis?domainId=${domainId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName }),
      })
      const data = await response.json()

      if (data.success) {
        setAnalysis(data.data)
      } else {
        setError(data.error || 'Failed to run analysis')
      }
    } catch {
      setError('Failed to run analysis')
    } finally {
      setRunning(false)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-error'
  }

  const getWeightBadge = (weight: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-error-bg text-error-foreground border-error-border',
      medium: 'bg-warning-bg text-warning-foreground border-warning-border',
      low: 'bg-info-bg text-info-foreground border-info-border',
    }
    const labels = { high: 'High Impact', medium: 'Medium', low: 'Low' }
    return (
      <Badge variant="outline" className={`text-xs ${styles[weight]}`}>
        {labels[weight]}
      </Badge>
    )
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate stats
  const passedChecks = analysis?.checks.filter(c => c.passed).length ?? 0
  const failedChecks = analysis?.checks.filter(c => !c.passed).length ?? 0
  const highImpactFailed = analysis?.checks.filter(c => !c.passed && c.weight === 'high').length ?? 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={domainUrl('/gbp')} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6" />
              GBP Analysis
            </h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-300 border-violet-300/50">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Checklist
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {selectedDomain?.name} - AI-powered dental practice optimization scoring
          </p>
        </div>
      </div>

      {/* Run Analysis Card (if no analysis yet) */}
      {!analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Run GBP Analysis</CardTitle>
            <CardDescription>
              Analyze your Google Business Profile against our dental practice optimization checklist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">City Name</label>
              <input
                type="text"
                placeholder="e.g., Chicago"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to check if city name is in your GBP business name
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-bg text-error-foreground text-sm">
                {error}
              </div>
            )}

            <Button className="cursor-pointer" onClick={runAnalysis} disabled={running}>
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="mr-2 h-4 w-4" />
              )}
              Run Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Score Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                    <p className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                  </div>
                  <div className="w-24 h-24">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-muted"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={`${analysis.score * 2.83} 283`}
                        className={getScoreColor(analysis.score)}
                      />
                    </svg>
                  </div>
                </div>
                {analysis.competitorAvgScore !== null && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm">
                      Competitor Average: <span className="font-medium">{analysis.competitorAvgScore.toFixed(0)}%</span>
                      {analysis.score > analysis.competitorAvgScore ? (
                        <Badge className="ml-2 bg-success-bg text-success-foreground">Above Average</Badge>
                      ) : (
                        <Badge className="ml-2 bg-warning-bg text-warning-foreground">Below Average</Badge>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="text-sm font-medium text-muted-foreground">Passed</p>
                </div>
                <p className="text-3xl font-bold text-success">{passedChecks}</p>
                <p className="text-sm text-muted-foreground">checks</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-error" />
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                </div>
                <p className="text-3xl font-bold text-error">{failedChecks}</p>
                <p className="text-sm text-muted-foreground">
                  {highImpactFailed > 0 && <span className="text-error">{highImpactFailed} high impact</span>}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Wins */}
          {analysis.quickWins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  Quick Wins
                </CardTitle>
                <CardDescription>
                  Easy improvements you can make today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.quickWins.map((win, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning-bg/50">
                      <Target className="h-5 w-5 text-warning-foreground mt-0.5" />
                      <p className="text-sm">{win}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Optimization Checklist
              </CardTitle>
              <CardDescription>
                Based on our dental practice optimization experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-4 rounded-lg border ${
                      check.passed ? 'border-success-border bg-success-bg/30' : 'border-error-border bg-error-bg/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {check.passed ? (
                          <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-error mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{check.label}</p>
                          <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Current:</span>
                            <code className="text-xs px-2 py-0.5 rounded bg-muted">
                              {String(check.currentValue ?? 'Not set')}
                            </code>
                            {!check.passed && (
                              <>
                                <span className="text-xs text-muted-foreground">Recommended:</span>
                                <code className="text-xs px-2 py-0.5 rounded bg-success-bg text-success-foreground">
                                  {String(check.recommendedValue)}
                                </code>
                              </>
                            )}
                          </div>
                          {!check.passed && check.recommendation && (
                            <div className="mt-3 p-2 rounded bg-muted/50">
                              <p className="text-sm flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                                {check.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {getWeightBadge(check.weight)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Prioritized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Re-run Analysis */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Last analyzed: {formatDate(analysis.analyzedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="City name"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button variant="outline" className="cursor-pointer" onClick={runAnalysis} disabled={running}>
                    {running ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Re-run Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Back link */}
      <Link href={domainUrl('/gbp')}>
        <Button variant="ghost" className="cursor-pointer">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to GBP Profile
        </Button>
      </Link>
    </div>
  )
}
