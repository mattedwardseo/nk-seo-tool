'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, AlertCircle } from 'lucide-react'

interface AttributeCategory {
  category: string
  attributes: string[]
}

interface GBPAttributesSectionProps {
  attributes: AttributeCategory[]
}

const categoryIcons: Record<string, string> = {
  Accessibility: '♿',
  Amenities: '🛋️',
  Offerings: '🍽️',
  'Payment Methods': '💳',
  Highlights: '⭐',
  Planning: '📅',
  'From the Business': '💼',
  'Service Options': '🛠️',
  'Dining Options': '🍴',
  'Health & Safety': '🏥',
}

export function GBPAttributesSection({
  attributes,
}: GBPAttributesSectionProps): React.ReactElement {
  if (attributes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Business Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">No attributes found for this business</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Business Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {attributes.reduce((acc, cat) => acc + cat.attributes.length, 0)} attributes
            across {attributes.length} categories
          </div>

          <div className="space-y-4">
            {attributes.map((category) => (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {categoryIcons[category.category] ?? '📋'}
                  </span>
                  <h4 className="font-medium text-sm">{category.category}</h4>
                  <Badge variant="outline" className="text-xs">
                    {category.attributes.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-7">
                  {category.attributes.map((attr, index) => (
                    <Badge
                      key={`${category.category}-${index}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1 text-green-600" />
                      {attr}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attribute Suggestions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Attribute Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Add More Attributes
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Complete profiles with more attributes rank better in local search.
                  Consider adding payment methods, accessibility features, and service
                  options if applicable.
                </p>
              </div>
            </div>

            {!attributes.find((a) => a.category === 'Accessibility') && (
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-500" />
                <span>Missing: Accessibility attributes</span>
              </div>
            )}

            {!attributes.find((a) => a.category === 'Payment Methods') && (
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-500" />
                <span>Missing: Payment methods</span>
              </div>
            )}

            {!attributes.find((a) => a.category === 'Service Options') && (
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-500" />
                <span>Missing: Service options</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
