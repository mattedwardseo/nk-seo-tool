'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Building2,
  Check,
  X,
} from 'lucide-react'

interface DayHours {
  day: string
  open: string
  close: string
  isOpen: boolean
}

interface GBPProfileData {
  businessName: string
  address?: string | null
  phone?: string | null
  website?: string | null
  categories?: string[]
  workHours?: DayHours[]
  photoCount?: number
  completenessScore?: number | null
}

interface GBPProfileSectionProps {
  profile: GBPProfileData
}

function getCompletenessColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function getCompletenessLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Improvement'
}

export function GBPProfileSection({ profile }: GBPProfileSectionProps): React.ReactElement {
  const completeness = profile.completenessScore ?? 0

  const profileFields = [
    { label: 'Business Name', value: profile.businessName, filled: !!profile.businessName },
    { label: 'Address', value: profile.address, filled: !!profile.address },
    { label: 'Phone', value: profile.phone, filled: !!profile.phone },
    { label: 'Website', value: profile.website, filled: !!profile.website },
    { label: 'Categories', value: profile.categories?.join(', '), filled: (profile.categories?.length ?? 0) > 0 },
    { label: 'Hours', value: profile.workHours?.length ? 'Set' : null, filled: (profile.workHours?.length ?? 0) > 0 },
    { label: 'Photos', value: profile.photoCount ? `${profile.photoCount} photos` : null, filled: (profile.photoCount ?? 0) > 0 },
  ]

  const filledCount = profileFields.filter((f) => f.filled).length
  const totalFields = profileFields.length

  return (
    <div className="space-y-4">
      {/* Completeness Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-4xl font-bold ${getCompletenessColor(completeness)}`}>
                {completeness}%
              </p>
              <p className="text-sm text-muted-foreground">
                {getCompletenessLabel(completeness)}
              </p>
            </div>
            <div className="flex-1">
              <Progress value={completeness} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {filledCount} of {totalFields} fields complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {profile.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{profile.address}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate max-w-[250px]"
                >
                  {profile.website}
                </a>
              </div>
            )}
          </div>

          {profile.categories && profile.categories.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Categories</p>
              <div className="flex flex-wrap gap-1">
                {profile.categories.map((cat, i) => (
                  <Badge key={i} variant={i === 0 ? 'default' : 'outline'} className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Hours */}
      {profile.workHours && profile.workHours.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {profile.workHours.map((day) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium w-24">{day.day}</span>
                  {day.isOpen ? (
                    <span className="text-muted-foreground">
                      {day.open} - {day.close}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between text-sm"
              >
                <span>{field.label}</span>
                {field.filled ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
