'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Bot,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { useDomain } from '@/contexts/DomainContext'

const SUGGESTED_KEYWORDS = [
  'best dentist near me',
  'dentist [city]',
  'emergency dentist',
  'teeth whitening near me',
  'dental implants cost',
  'pediatric dentist',
  'cosmetic dentist',
]

const LLM_PLATFORMS = [
  { id: 'chatgpt', label: 'ChatGPT', description: 'OpenAI\'s conversational AI', icon: '🤖' },
  { id: 'gemini', label: 'Google Gemini', description: 'Google\'s AI assistant', icon: '✨' },
  { id: 'perplexity', label: 'Perplexity', description: 'AI-powered search engine', icon: '🔍' },
  { id: 'claude', label: 'Claude', description: 'Anthropic\'s AI assistant', icon: '🧠' },
]

export default function NewAISeoPage() {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  
  const [businessName, setBusinessName] = useState(selectedDomain?.name || '')
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['chatgpt', 'gemini', 'perplexity'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const handleAddKeyword = () => {
    const keyword = newKeyword.trim()
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleAddSuggested = (keyword: string) => {
    // Replace [city] with actual city if available
    const processedKeyword = selectedDomain?.city 
      ? keyword.replace('[city]', selectedDomain.city)
      : keyword.replace(' [city]', '')
    
    if (!keywords.includes(processedKeyword)) {
      setKeywords([...keywords, processedKeyword])
    }
  }

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      setError('Please enter a business name')
      return
    }
    if (keywords.length === 0) {
      setError('Please add at least one keyword')
      return
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one AI platform')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId,
          businessName: businessName.trim(),
          keywords,
          llmPlatforms: selectedPlatforms,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(domainUrl(`/ai-seo/${data.data.id}`))
      } else {
        setError(data.error || 'Failed to create analysis')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={domainUrl('/ai-seo')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI SEO
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Bot className="h-5 w-5 text-violet-500" />
          </div>
          New AI Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Check how AI platforms mention your business for specific keywords
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Business Name */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              The name AI should mention to count as a successful result
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="e.g., Bright Smiles Dental"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll look for mentions of this name in AI responses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Keywords to Track</CardTitle>
            <CardDescription>
              Add keywords that potential customers might ask AI about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add keyword input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected keywords */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested keywords */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Suggested keywords:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_KEYWORDS.map((keyword) => {
                  const processedKeyword = selectedDomain?.city 
                    ? keyword.replace('[city]', selectedDomain.city)
                    : keyword.replace(' [city]', '')
                  
                  const isAdded = keywords.includes(processedKeyword)
                  
                  return (
                    <button
                      key={keyword}
                      onClick={() => handleAddSuggested(keyword)}
                      disabled={isAdded}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        isAdded
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 dark:hover:bg-violet-950/50'
                      }`}
                    >
                      {processedKeyword}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>AI Platforms</CardTitle>
            <CardDescription>
              Select which AI platforms to query
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {LLM_PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleTogglePlatform(platform.id)}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handleTogglePlatform(platform.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{platform.icon}</span>
                      <span className="font-medium">{platform.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="py-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={domainUrl('/ai-seo')}>Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#FF6B35] hover:bg-[#E85A2A]"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Run Analysis
          </Button>
        </div>
      </div>
    </div>
  )
}

