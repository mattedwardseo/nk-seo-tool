'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import {
  Search,
  AlertCircle,
  Building2,
  MapPin,
  Target,
  Users,
  ChevronDown,
  X,
  Plus,
  Download,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { US_STATES } from '@/lib/keywords/preset-keywords'

const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .refine(
    (val) => {
      const cleaned = val.replace(/^https?:\/\//, '').replace(/^www\./, '')
      return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(cleaned)
    },
    { message: 'Please enter a valid domain (e.g., example.com)' }
  )

const formSchema = z.object({
  domain: domainSchema,
  businessName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  location: z.string().max(200).optional(), // Legacy, computed from city+state
  gmbPlaceId: z.string().max(100).optional(),
  targetKeywords: z.array(z.string()).max(20).optional(),
  competitorDomains: z.array(z.string()).max(5).optional(),
})

type FormData = z.infer<typeof formSchema>

interface NewAuditFormProps {
  onAuditCreated?: (auditId: string) => void
}

export function NewAuditForm({ onAuditCreated }: NewAuditFormProps): React.ReactElement {
  const router = useRouter()
  const { data: session } = useSession()
  const [formData, setFormData] = React.useState<FormData>({
    domain: '',
    businessName: '',
    city: '',
    state: '',
    location: '',
    gmbPlaceId: '',
    targetKeywords: [],
    competitorDomains: [],
  })
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [keywordInput, setKeywordInput] = React.useState('')
  const [competitorInput, setCompetitorInput] = React.useState('')
  const [isLoadingKeywords, setIsLoadingKeywords] = React.useState(false)
  const [savedKeywordsCount, setSavedKeywordsCount] = React.useState<number | null>(null)

  const cleanDomain = (val: string): string => {
    return val
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .toLowerCase()
      .trim()
  }

  const addKeyword = (): void => {
    const keyword = keywordInput.trim().toLowerCase()
    if (
      keyword &&
      formData.targetKeywords &&
      !formData.targetKeywords.includes(keyword) &&
      formData.targetKeywords.length < 20
    ) {
      setFormData({
        ...formData,
        targetKeywords: [...formData.targetKeywords, keyword],
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string): void => {
    setFormData({
      ...formData,
      targetKeywords: formData.targetKeywords?.filter((k) => k !== keyword) || [],
    })
  }

  const addCompetitor = (): void => {
    const competitor = cleanDomain(competitorInput)
    const validation = domainSchema.safeParse(competitor)
    if (
      validation.success &&
      formData.competitorDomains &&
      !formData.competitorDomains.includes(competitor) &&
      formData.competitorDomains.length < 5
    ) {
      setFormData({
        ...formData,
        competitorDomains: [...formData.competitorDomains, competitor],
      })
      setCompetitorInput('')
    }
  }

  const removeCompetitor = (competitor: string): void => {
    setFormData({
      ...formData,
      competitorDomains: formData.competitorDomains?.filter((c) => c !== competitor) || [],
    })
  }

  // Check if there are saved keywords when domain changes
  const checkSavedKeywords = React.useCallback(async (domain: string): Promise<void> => {
    const cleaned = cleanDomain(domain)
    if (!cleaned || cleaned.length < 4) {
      setSavedKeywordsCount(null)
      return
    }

    try {
      const response = await fetch(`/api/keywords?domain=${encodeURIComponent(cleaned)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.count > 0) {
          setSavedKeywordsCount(data.data.count)
        } else {
          setSavedKeywordsCount(null)
        }
      }
    } catch {
      // Silently fail - this is just a hint
      setSavedKeywordsCount(null)
    }
  }, [])

  // Load saved keywords for the domain
  const loadSavedKeywords = async (): Promise<void> => {
    const domain = cleanDomain(formData.domain)
    if (!domain) return

    setIsLoadingKeywords(true)
    try {
      const response = await fetch(`/api/keywords?domain=${encodeURIComponent(domain)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.keywords.length > 0) {
          const savedKeywords = data.data.keywords.map((k: { keyword: string }) => k.keyword)
          // Merge with existing, avoiding duplicates
          const existingKeywords = formData.targetKeywords || []
          const merged = [...new Set([...existingKeywords, ...savedKeywords])].slice(0, 20)
          setFormData({
            ...formData,
            targetKeywords: merged,
          })
          toast.success(`Loaded ${savedKeywords.length} saved keywords`)
        } else {
          toast.info('No saved keywords found for this domain')
        }
      }
    } catch {
      toast.error('Failed to load saved keywords')
    } finally {
      setIsLoadingKeywords(false)
    }
  }

  // Save keywords after creating audit
  const saveKeywordsForDomain = async (domain: string, keywords: string[]): Promise<void> => {
    if (!keywords || keywords.length === 0) return

    try {
      await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, keywords }),
      })
    } catch {
      // Silently fail - keywords will be in the audit anyway
      console.warn('Failed to save keywords for domain')
    }
  }

  // Check for saved keywords when domain changes (debounced)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkSavedKeywords(formData.domain)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.domain, checkSavedKeywords])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    // Validate form
    const cleanedDomain = cleanDomain(formData.domain)
    const validation = formSchema.safeParse({
      ...formData,
      domain: cleanedDomain,
    })

    if (!validation.success) {
      const issues = validation.error.issues
      setError(issues[0]?.message || 'Invalid form data')
      return
    }

    if (!session?.user?.id) {
      setError('You must be logged in to create an audit')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: cleanedDomain,
          businessName: formData.businessName || undefined,
          location: formData.location || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          gmbPlaceId: formData.gmbPlaceId || undefined,
          targetKeywords:
            formData.targetKeywords && formData.targetKeywords.length > 0
              ? formData.targetKeywords
              : undefined,
          competitorDomains:
            formData.competitorDomains && formData.competitorDomains.length > 0
              ? formData.competitorDomains
              : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Save keywords for future use
        if (formData.targetKeywords && formData.targetKeywords.length > 0) {
          await saveKeywordsForDomain(cleanedDomain, formData.targetKeywords)
        }

        toast.success('Audit started successfully')
        if (onAuditCreated) {
          onAuditCreated(data.data.auditId)
        } else {
          router.push(`/audits/${data.data.auditId}`)
        }
      } else {
        setError(data.error || 'Failed to start audit')
        toast.error(data.error || 'Failed to start audit')
      }
    } catch {
      setError('Failed to start audit. Please try again.')
      toast.error('Failed to start audit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start New Project</CardTitle>
        <CardDescription>
          Enter a domain to analyze its SEO performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Domain (Required) */}
          <div className="space-y-2">
            <Label htmlFor="domain">
              Domain <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="domain"
                type="text"
                placeholder="example.com"
                value={formData.domain}
                onChange={(e) => {
                  setFormData({ ...formData, domain: e.target.value })
                  setError(null)
                }}
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Enter without http:// or www
            </p>
          </div>

          {/* Business & Location Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Business Name
              </Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Fielder Park Dental"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                disabled={isSubmitting}
              />
              <p className="text-muted-foreground text-xs">
                For Google Business Profile lookup
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    id="city"
                    type="text"
                    placeholder="City (e.g., Arlington)"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        city: e.target.value,
                        location: e.target.value && formData.state
                          ? `${e.target.value}, ${formData.state}`
                          : '',
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Select
                    value={formData.state}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        state: value,
                        location: formData.city && value
                          ? `${formData.city}, ${value}`
                          : '',
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                City &amp; State for local keyword tracking (85 keywords auto-added)
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center justify-between p-0 hover:bg-transparent"
              >
                <span className="text-muted-foreground text-sm font-medium">
                  Advanced Options
                </span>
                <ChevronDown
                  className={`text-muted-foreground h-4 w-4 transition-transform ${
                    showAdvanced ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {/* Target Keywords */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" />
                    Target Keywords
                    <span className="text-muted-foreground text-xs">
                      ({formData.targetKeywords?.length || 0}/20)
                    </span>
                  </Label>
                  {savedKeywordsCount !== null && savedKeywordsCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={loadSavedKeywords}
                      disabled={isLoadingKeywords || isSubmitting}
                    >
                      {isLoadingKeywords ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      Load saved ({savedKeywordsCount})
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="dentist near me"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addKeyword()
                      }
                    }}
                    disabled={
                      isSubmitting || (formData.targetKeywords?.length || 0) >= 20
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addKeyword}
                    disabled={
                      isSubmitting ||
                      !keywordInput.trim() ||
                      (formData.targetKeywords?.length || 0) >= 20
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.targetKeywords && formData.targetKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.targetKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  Specific keywords to track rankings for
                </p>
              </div>

              {/* Competitor Domains */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Competitor Domains
                  <span className="text-muted-foreground text-xs">
                    ({formData.competitorDomains?.length || 0}/5)
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="competitor.com"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCompetitor()
                      }
                    }}
                    disabled={
                      isSubmitting ||
                      (formData.competitorDomains?.length || 0) >= 5
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCompetitor}
                    disabled={
                      isSubmitting ||
                      !competitorInput.trim() ||
                      (formData.competitorDomains?.length || 0) >= 5
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.competitorDomains &&
                  formData.competitorDomains.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.competitorDomains.map((competitor) => (
                        <Badge
                          key={competitor}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {competitor}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(competitor)}
                            className="hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                <p className="text-muted-foreground text-xs">
                  Compare your SEO against competitors
                </p>
              </div>

              {/* GBP Place ID (for power users) */}
              <div className="space-y-2">
                <Label htmlFor="gmbPlaceId" className="text-muted-foreground">
                  Google Place ID (optional)
                </Label>
                <Input
                  id="gmbPlaceId"
                  type="text"
                  placeholder="ChIJ..."
                  value={formData.gmbPlaceId}
                  onChange={(e) =>
                    setFormData({ ...formData, gmbPlaceId: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="font-mono text-xs"
                />
                <p className="text-muted-foreground text-xs">
                  If you know the exact Google Place ID
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Error Display */}
          {error && (
            <div className="text-destructive flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.domain.trim()}
            className="w-full cursor-pointer"
          >
            {isSubmitting ? 'Starting Project...' : 'Start Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
