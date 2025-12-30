'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialMediaTags } from '@/types/audit'

interface SocialTagsSectionProps {
  socialTags: SocialMediaTags | null | undefined
}

// Group tags by type
function groupSocialTags(
  tags: SocialMediaTags
): { og: Record<string, string>; twitter: Record<string, string>; other: Record<string, string> } {
  const og: Record<string, string> = {}
  const twitter: Record<string, string> = {}
  const other: Record<string, string> = {}

  for (const [key, value] of Object.entries(tags)) {
    if (value === undefined || value === null) continue

    if (key.startsWith('og:') || key.startsWith('og_')) {
      og[key] = value
    } else if (key.startsWith('twitter:') || key.startsWith('twitter_')) {
      twitter[key] = value
    } else {
      other[key] = value
    }
  }

  return { og, twitter, other }
}

interface TagGroupProps {
  title: string
  tags: Record<string, string>
  variant: 'og' | 'twitter' | 'other'
}

function TagGroup({ title, tags, variant }: TagGroupProps): React.ReactElement | null {
  const entries = Object.entries(tags)
  if (entries.length === 0) return null

  const colorClasses = {
    og: 'border-blue-500/30 bg-blue-500/5',
    twitter: 'border-sky-500/30 bg-sky-500/5',
    other: 'border-gray-500/30 bg-gray-500/5',
  }

  return (
    <div className={cn('rounded-lg border p-4', colorClasses[variant])}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="text-xs">
          {entries.length} tags
        </Badge>
      </div>
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-mono text-xs text-muted-foreground truncate" title={key}>
              {key}
            </div>
            <div className="col-span-2 break-words text-xs">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Required OG tags
const REQUIRED_OG_TAGS = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']
// Required Twitter tags
const REQUIRED_TWITTER_TAGS = ['twitter:card', 'twitter:title', 'twitter:description']

function getMissingTags(tags: Record<string, string>, required: string[]): string[] {
  return required.filter((tag) => !tags[tag] && !tags[tag.replace(':', '_')])
}

export function SocialTagsSection({ socialTags }: SocialTagsSectionProps): React.ReactElement {
  if (!socialTags || Object.keys(socialTags).length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Social Media Tags</CardTitle>
              <CardDescription>Open Graph and Twitter Card meta tags</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <XCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">No social media tags found</p>
              <p className="text-xs text-muted-foreground">
                Add Open Graph and Twitter Card tags to control how your page appears when shared
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { og, twitter, other } = groupSocialTags(socialTags)
  const missingOg = getMissingTags(og, REQUIRED_OG_TAGS)
  const missingTwitter = getMissingTags(twitter, REQUIRED_TWITTER_TAGS)

  const hasOg = Object.keys(og).length > 0
  const hasTwitter = Object.keys(twitter).length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Social Media Tags</CardTitle>
              <CardDescription>Open Graph and Twitter Card meta tags</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {hasOg ? (
              <Badge variant="outline" className="border-green-500 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                OG
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                OG
              </Badge>
            )}
            {hasTwitter ? (
              <Badge variant="outline" className="border-green-500 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Twitter
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                Twitter
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Missing tags warnings */}
        {(missingOg.length > 0 || missingTwitter.length > 0) && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
              Missing recommended tags
            </p>
            <div className="flex flex-wrap gap-1">
              {missingOg.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-yellow-500/50">
                  {tag}
                </Badge>
              ))}
              {missingTwitter.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-yellow-500/50">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tag groups */}
        <div className="grid gap-4 md:grid-cols-2">
          <TagGroup title="Open Graph" tags={og} variant="og" />
          <TagGroup title="Twitter Card" tags={twitter} variant="twitter" />
        </div>
        {Object.keys(other).length > 0 && <TagGroup title="Other Social Tags" tags={other} variant="other" />}
      </CardContent>
    </Card>
  )
}

export default SocialTagsSection
