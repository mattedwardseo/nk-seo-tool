'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Plus, X, Loader2 } from 'lucide-react'

const campaignSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gmbPlaceId: z.string().optional(),
  gmbCid: z.string().optional(),
  centerLat: z.number().min(-90).max(90, 'Invalid latitude'),
  centerLng: z.number().min(-180).max(180, 'Invalid longitude'),
  gridSize: z.number().min(3).max(15),
  gridRadiusMiles: z.number().min(0.5).max(50),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  scanFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>
  onSubmit: (data: CampaignFormData) => Promise<void>
  onCancel?: () => void
  isEditing?: boolean
}

export function CampaignForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: CampaignFormProps): React.ReactElement {
  const [keywordInput, setKeywordInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      businessName: initialData?.businessName ?? '',
      gmbPlaceId: initialData?.gmbPlaceId ?? '',
      gmbCid: initialData?.gmbCid ?? '',
      centerLat: initialData?.centerLat ?? 0,
      centerLng: initialData?.centerLng ?? 0,
      gridSize: initialData?.gridSize ?? 7,
      gridRadiusMiles: initialData?.gridRadiusMiles ?? 3,
      keywords: initialData?.keywords ?? [],
      scanFrequency: initialData?.scanFrequency ?? 'weekly',
    },
  })

  const keywords = watch('keywords')
  const gridSize = watch('gridSize')
  const gridRadiusMiles = watch('gridRadiusMiles')

  const addKeyword = (): void => {
    const trimmed = keywordInput.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      setValue('keywords', [...keywords, trimmed])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string): void => {
    setValue(
      'keywords',
      keywords.filter((k) => k !== keyword)
    )
  }

  const handleFormSubmit = async (data: CampaignFormData): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate estimated cost
  const pointsPerKeyword = gridSize * gridSize
  const totalApiCalls = pointsPerKeyword * keywords.length
  const estimatedCost = (totalApiCalls * 0.005).toFixed(2)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Enter the business details and location for tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              {...register('businessName')}
              placeholder="e.g., Fielder Park Dental"
            />
            {errors.businessName && (
              <p className="text-sm text-destructive">{errors.businessName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gmbPlaceId">Google Place ID</Label>
              <Input
                id="gmbPlaceId"
                {...register('gmbPlaceId')}
                placeholder="ChIJ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmbCid">Google CID</Label>
              <Input
                id="gmbCid"
                {...register('gmbCid')}
                placeholder="12345678901234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="centerLat">Center Latitude *</Label>
              <Input
                id="centerLat"
                type="number"
                step="any"
                {...register('centerLat', { valueAsNumber: true })}
                placeholder="32.7357"
              />
              {errors.centerLat && (
                <p className="text-sm text-destructive">{errors.centerLat.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="centerLng">Center Longitude *</Label>
              <Input
                id="centerLng"
                type="number"
                step="any"
                {...register('centerLng', { valueAsNumber: true })}
                placeholder="-97.1081"
              />
              {errors.centerLng && (
                <p className="text-sm text-destructive">{errors.centerLng.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grid Configuration</CardTitle>
          <CardDescription>Configure the search grid for local rankings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gridSize">Grid Size</Label>
              <Select
                value={gridSize.toString()}
                onValueChange={(val) => setValue('gridSize', parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5×5 (25 points)</SelectItem>
                  <SelectItem value="7">7×7 (49 points)</SelectItem>
                  <SelectItem value="9">9×9 (81 points)</SelectItem>
                  <SelectItem value="11">11×11 (121 points)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gridRadiusMiles">Grid Radius (miles)</Label>
              <Select
                value={gridRadiusMiles.toString()}
                onValueChange={(val) => setValue('gridRadiusMiles', parseFloat(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mile (tight)</SelectItem>
                  <SelectItem value="2">2 miles</SelectItem>
                  <SelectItem value="3">3 miles (recommended)</SelectItem>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="15">15 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {gridSize}×{gridSize} grid = {gridSize * gridSize} search points covering{' '}
              {gridRadiusMiles * 2} miles
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>Add keywords to track in local search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addKeyword()
                }
              }}
              placeholder="e.g., dentist near me"
            />
            <Button type="button" variant="outline" onClick={addKeyword}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="pr-1">
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {errors.keywords && (
            <p className="text-sm text-destructive">{errors.keywords.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Configure automatic scan frequency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Scan Frequency</Label>
            <Select
              value={watch('scanFrequency')}
              onValueChange={(val: 'daily' | 'weekly' | 'biweekly' | 'monthly') =>
                setValue('scanFrequency', val)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm font-medium">Estimated Cost per Scan</p>
            <p className="text-2xl font-bold">${estimatedCost}</p>
            <p className="text-xs text-muted-foreground">
              {totalApiCalls} API calls ({pointsPerKeyword} points × {keywords.length} keywords)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  )
}
