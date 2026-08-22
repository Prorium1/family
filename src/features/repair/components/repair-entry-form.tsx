'use client'

import { useActionState, useState } from 'react'
import {
  saveRepairEntriesAction,
  type RepairEntriesState,
} from '@/server/actions/repair-actions'
import type { VisibilityLevel } from '@/types/domain'
import type { RepairEntryDTO } from '@/types/dto'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { VisibilityPicker } from '@/features/daily-questions/components/visibility-picker'

/**
 * The seven repair prompts (spec §12). Visibility defaults to "AI summary
 * only" — raw text is never auto-shared with the partner.
 */
export function RepairEntryForm({
  sessionId,
  prompts,
  initialEntries,
  disabled,
}: {
  sessionId: string
  prompts: Array<{ id: string; text: string; helper?: string }>
  initialEntries: RepairEntryDTO[]
  disabled: boolean
}) {
  const [state, formAction, pending] = useActionState<RepairEntriesState, FormData>(
    saveRepairEntriesAction,
    {},
  )
  const [visibility, setVisibility] = useState<VisibilityLevel>(
    initialEntries[0]?.visibility ?? 'ai_summary',
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="visibility" value={visibility} />
      <p className="rounded-card-sm bg-surface-muted px-4 py-3 text-xs text-text-muted">
        書いた内容は、あなたが選んだ範囲でしか共有されません。原文が自動でパートナーに送られることはありません。
      </p>
      {prompts.map((prompt) => (
        <div key={prompt.id} className="space-y-1.5">
          <Label htmlFor={`repair-${prompt.id}`}>{prompt.text}</Label>
          {prompt.helper ? <p className="text-xs text-text-muted">{prompt.helper}</p> : null}
          <Textarea
            id={`repair-${prompt.id}`}
            name={`entry:${prompt.id}`}
            defaultValue={initialEntries.find((e) => e.promptId === prompt.id)?.text ?? ''}
            className="min-h-24"
            maxLength={4000}
            disabled={disabled}
          />
        </div>
      ))}
      <VisibilityPicker value={visibility} onChange={setVisibility} disabled={disabled} />
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {!disabled ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" name="submit" value="false" variant="outline" disabled={pending}>
            下書き保存
          </Button>
          <Button type="submit" name="submit" value="true" className="flex-1" disabled={pending}>
            整理を送信する
          </Button>
        </div>
      ) : null}
    </form>
  )
}
