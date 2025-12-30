'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, ClipboardList } from 'lucide-react'
import type { ManualCheckItem } from '@/lib/local-seo/types'

interface ManualChecksCardProps {
  items: ManualCheckItem[]
}

export function ManualChecksCard({ items }: ManualChecksCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Manual Verification Required
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          These items can&apos;t be fetched via API. Check them manually in Google Business Profile.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.field}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="font-medium text-sm">{item.label}</span>
                <a
                  href="https://business.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          <a
            href="https://business.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Open Google Business Profile
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
