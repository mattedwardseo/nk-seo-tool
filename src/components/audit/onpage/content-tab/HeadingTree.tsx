'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnPageMeta } from '@/types/audit'

interface HeadingTreeProps {
  htags: OnPageMeta['htags'] | undefined
}

const headingConfig: Record<string, { level: number; color: string; bgColor: string }> = {
  h1: { level: 1, color: 'text-primary', bgColor: 'bg-primary/10' },
  h2: { level: 2, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
  h3: { level: 3, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  h4: { level: 4, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10' },
  h5: { level: 5, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
  h6: { level: 6, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
}

interface HeadingItemProps {
  tag: string
  text: string
}

const defaultConfig = { level: 6, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' }

function HeadingItem({ tag, text }: HeadingItemProps): React.ReactElement {
  const config = headingConfig[tag] ?? defaultConfig
  const indent = (config.level - 1) * 16

  return (
    <div
      className={cn('flex items-start gap-2 py-1.5', config.level > 1 && 'border-l-2 border-muted')}
      style={{ marginLeft: `${indent}px`, paddingLeft: config.level > 1 ? '12px' : '0' }}
    >
      <Badge
        variant="outline"
        className={cn('uppercase text-xs font-mono flex-shrink-0', config.color, config.bgColor)}
      >
        {tag}
      </Badge>
      <span className="text-sm break-words">{text || <i className="text-muted-foreground">Empty</i>}</span>
    </div>
  )
}

export function HeadingTree({ htags }: HeadingTreeProps): React.ReactElement {
  if (!htags) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Heading Structure</CardTitle>
          <CardDescription>No heading data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Flatten all headings with their types for display
  const allHeadings: Array<{ tag: string; text: string }> = []

  // Add headings in document order approximation
  // Since we don't have exact positions, we show H1s first, then H2s, etc.
  const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
  for (const tag of tags) {
    const headings = htags[tag]
    if (headings && headings.length > 0) {
      for (const text of headings) {
        allHeadings.push({ tag, text })
      }
    }
  }

  // Calculate heading counts
  const h1Count = htags.h1?.length || 0
  const totalHeadings = allHeadings.length
  const hasH1Issue = h1Count === 0 || h1Count > 1

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Heading Structure</CardTitle>
            <CardDescription>H1 through H6 tags found on the page</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasH1Issue ? (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {h1Count === 0 ? 'Missing H1' : `${h1Count} H1 tags`}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-green-500 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />1 H1 tag
              </Badge>
            )}
            <Badge variant="secondary">{totalHeadings} headings</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allHeadings.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No headings found on this page</p>
        ) : (
          <div className="space-y-0.5">
            {allHeadings.map((heading, index) => (
              <HeadingItem key={`${heading.tag}-${index}`} tag={heading.tag} text={heading.text} />
            ))}
          </div>
        )}

        {/* Heading count summary */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Heading Counts</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const count = htags[tag]?.length || 0
              const tagConfig = headingConfig[tag] ?? defaultConfig
              return (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    'uppercase',
                    count > 0 ? tagConfig.color : 'text-muted-foreground'
                  )}
                >
                  {tag}: {count}
                </Badge>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default HeadingTree
