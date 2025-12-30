'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import { Calculator, TrendingUp, DollarSign, Building2, ArrowRight } from 'lucide-react'

export default function CalculatorsPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const CALCULATORS = [
    {
      id: 'seo',
      name: 'SEO Calculator',
      description: 'Calculate ROI from organic and local maps search traffic',
      icon: TrendingUp,
      href: domainUrl('/calculators/seo'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      features: [
        'Organic + Local Maps traffic',
        'Conversion funnel analysis',
        'Good/Average/Bad scenarios',
        'Lifetime value projections',
      ],
    },
    {
      id: 'google-ads',
      name: 'Google Ads Calculator',
      description: 'Calculate ROI from paid search campaigns',
      icon: DollarSign,
      href: domainUrl('/calculators/google-ads'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      features: [
        'Budget + mgmt fee breakdown',
        'CPC-based click projections',
        'ROAS calculations',
        'Conversion funnel analysis',
      ],
    },
    {
      id: 'capacity',
      name: 'Capacity Calculator',
      description: 'Calculate practice capacity and revenue potential',
      icon: Building2,
      href: domainUrl('/calculators/capacity'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      features: [
        'Operatory utilization',
        'Revenue capacity',
        'Gap analysis',
        'Growth planning',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Calculator className="h-6 w-6" />
          Calculators
        </h1>
        <p className="text-muted-foreground">
          ROI calculators for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CALCULATORS.map((calc) => (
          <Card key={calc.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${calc.bgColor}`}>
                  <calc.icon className={`h-5 w-5 ${calc.color}`} />
                </div>
              </div>
              <CardTitle className="text-lg">{calc.name}</CardTitle>
              <CardDescription>{calc.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {calc.features.map((feature) => (
                  <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full">
                <Link href={calc.href}>
                  Open Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
