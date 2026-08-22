'use client'

import { VISIBILITY_LEVELS, type VisibilityLevel } from '@/types/domain'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const labels: Record<VisibilityLevel, string> = {
  private: '自分だけが見られる',
  ai_only: 'AIだけに共有する',
  ai_summary: 'AIの要約のみパートナーに共有',
  shared_excerpt: '選んだ文章だけ共有',
  shared: '原文をパートナーに共有',
}

/** The 5-level visibility contract (spec §4-4), chosen by the author. */
export function VisibilityPicker({
  value,
  onChange,
  disabled,
  levels = VISIBILITY_LEVELS,
}: {
  value: VisibilityLevel
  onChange: (v: VisibilityLevel) => void
  disabled?: boolean
  levels?: readonly VisibilityLevel[]
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="visibility-picker">共有範囲</Label>
      <Select value={value} onValueChange={(v) => onChange(v as VisibilityLevel)} disabled={disabled}>
        <SelectTrigger id="visibility-picker" aria-label="共有範囲">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {levels.map((level) => (
            <SelectItem key={level} value={level}>
              {labels[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
