'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MapPin } from 'lucide-react'
import { DEFAULT_LOCAL_CTR } from '@/lib/calculators/seo-calculator'

interface LocalMapsSectionProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  localSearchVolume: number
  onLocalSearchVolumeChange: (value: number) => void
  localCtr: number
  onLocalCtrChange: (value: number) => void
  localConvRate: number
  onLocalConvRateChange: (value: number) => void
  disabled?: boolean
}

export function LocalMapsSection({
  enabled,
  onEnabledChange,
  localSearchVolume,
  onLocalSearchVolumeChange,
  localCtr,
  onLocalCtrChange,
  localConvRate,
  onLocalConvRateChange,
  disabled = false,
}: LocalMapsSectionProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div>
            <Label htmlFor="localMapsToggle" className="font-medium">
              Local Maps / Map Pack
            </Label>
            <p className="text-xs text-muted-foreground">
              Include local search results (typically higher CTR)
            </p>
          </div>
        </div>
        <Switch
          id="localMapsToggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>

      {enabled && (
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="localSearchVolume" className="text-sm">
              Local Search Volume
            </Label>
            <Input
              id="localSearchVolume"
              type="number"
              value={localSearchVolume || ''}
              onChange={(e) => onLocalSearchVolumeChange(parseInt(e.target.value) || 0)}
              placeholder="1000"
              min="0"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Monthly map pack searches</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localCtr" className="text-sm">
              Local CTR (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="localCtr"
                type="number"
                value={localCtr * 100 || ''}
                onChange={(e) => onLocalCtrChange(parseFloat(e.target.value) / 100 || 0)}
                placeholder={`${DEFAULT_LOCAL_CTR * 100}`}
                min="0"
                max="100"
                step="1"
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Default: {DEFAULT_LOCAL_CTR * 100}%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localConvRate" className="text-sm">
              Local Conv. Rate (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="localConvRate"
                type="number"
                value={localConvRate * 100 || ''}
                onChange={(e) => onLocalConvRateChange(parseFloat(e.target.value) / 100 || 0)}
                placeholder="20"
                min="0"
                max="100"
                step="1"
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Maps leads to prospects</p>
          </div>
        </div>
      )}
    </div>
  )
}
