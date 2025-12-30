'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

export interface KeywordInput {
  keyword: string
  searchVolume: number
  cpc: number
  position?: number
}

interface KeywordInputsProps {
  keywords: KeywordInput[]
  onChange: (keywords: KeywordInput[]) => void
  disabled?: boolean
}

export function KeywordInputs({ keywords, onChange, disabled = false }: KeywordInputsProps) {
  const addKeyword = () => {
    onChange([...keywords, { keyword: '', searchVolume: 0, cpc: 0 }])
  }

  const removeKeyword = (index: number) => {
    const updated = keywords.filter((_, i) => i !== index)
    onChange(updated)
  }

  const updateKeyword = (
    index: number,
    field: keyof KeywordInput,
    value: string | number | undefined
  ) => {
    const updated = keywords.map((kw, i) => {
      if (i !== index) return kw
      return { ...kw, [field]: value }
    })
    onChange(updated)
  }

  const totalSearchVolume = keywords.reduce((sum, kw) => sum + (kw.searchVolume || 0), 0)
  const avgCpc =
    keywords.length > 0
      ? keywords.reduce((sum, kw) => sum + (kw.cpc || 0), 0) / keywords.length
      : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Keywords</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addKeyword}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Keyword
        </Button>
      </div>

      {keywords.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/50">
          No keywords added. Click "Add Keyword" to get started, or enter a combined search volume
          below.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
            <div className="col-span-4">Keyword</div>
            <div className="col-span-2">Search Vol.</div>
            <div className="col-span-2">CPC ($)</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-2"></div>
          </div>

          {/* Rows */}
          {keywords.map((kw, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Input
                  placeholder="e.g., dentist arlington tx"
                  value={kw.keyword}
                  onChange={(e) => updateKeyword(index, 'keyword', e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="1000"
                  value={kw.searchVolume || ''}
                  onChange={(e) => updateKeyword(index, 'searchVolume', parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  className="h-9"
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="5.00"
                  value={kw.cpc || ''}
                  onChange={(e) => updateKeyword(index, 'cpc', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className="h-9"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="1-100"
                  value={kw.position || ''}
                  onChange={(e) => updateKeyword(index, 'position', parseInt(e.target.value) || undefined)}
                  disabled={disabled}
                  className="h-9"
                  min="1"
                  max="100"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyword(index)}
                  disabled={disabled}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">
              {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <span>
                Total SV:{' '}
                <span className="font-medium">{totalSearchVolume.toLocaleString()}</span>
              </span>
              <span>
                Avg CPC: <span className="font-medium">${avgCpc.toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
