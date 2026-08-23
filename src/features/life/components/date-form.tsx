'use client'

import { useState } from 'react'
import { addCoupleDateAction } from '@/server/actions/life-actions'
import { COUPLE_DATE_KINDS, type CoupleDateKind } from '@/types/domain'
import { DATE_KIND_DEFAULT_YEARLY, DATE_KIND_LABELS } from '@/lib/ui/couple-life'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Add one date. The kind decides the wording and the yearly default —
 * a memorial day arrives pre-set to repeat, a trip does not.
 */
export function DateForm() {
  const [kind, setKind] = useState<CoupleDateKind>('anniversary')

  return (
    <form action={addCoupleDateAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date-kind">種類</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as CoupleDateKind)}>
            <SelectTrigger id="date-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUPLE_DATE_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {DATE_KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="kind" value={kind} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date-date">日付</Label>
          <Input id="date-date" name="date" type="date" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date-title">名前</Label>
        <Input
          id="date-title"
          name="title"
          required
          maxLength={80}
          placeholder={kind === 'memorial' ? '例: おばあちゃんの命日' : '例: 付き合いはじめた日'}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date-note">ひとことメモ（任意）</Label>
        <Input id="date-note" name="note" maxLength={500} placeholder="場所や、忘れたくないこと" />
      </div>

      <Label className="flex items-center gap-3 font-normal">
        {/* key remounts the checkbox so the kind's default applies */}
        <Checkbox key={kind} name="repeatsYearly" defaultChecked={DATE_KIND_DEFAULT_YEARLY[kind]} />
        毎年くりかえす
      </Label>

      <Button type="submit" variant="secondary" className="w-full">
        予定に加える
      </Button>
    </form>
  )
}
