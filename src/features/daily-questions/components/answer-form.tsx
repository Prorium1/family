'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { saveDraftAction, submitAnswerAction, type DailyActionState } from '@/server/actions/daily-actions'
import type { AnswerValue } from '@/types/entities'
import type { VisibilityLevel } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { VisibilityPicker } from './visibility-picker'

interface AnswerFormProps {
  assignmentId: string
  format: string
  options: string[] | null
  initialValue: AnswerValue | null
  initialVisibility: VisibilityLevel
  submitted: boolean
}

/**
 * Answer input with autosave (spec §20): drafts persist as you type, and
 * submission asks for confirmation. Formats beyond the implemented set fall
 * back to free text.
 */
export function AnswerForm({
  assignmentId,
  format,
  options,
  initialValue,
  initialVisibility,
  submitted,
}: AnswerFormProps) {
  const [text, setText] = useState(initialValue?.kind === 'text' ? initialValue.text : '')
  const [choice, setChoice] = useState(
    initialValue?.kind === 'choice' ? (initialValue.selected[0] ?? '') : '',
  )
  const [scale, setScale] = useState(
    initialValue?.kind === 'scale' ? String(initialValue.value) : '',
  )
  const [visibility, setVisibility] = useState<VisibilityLevel>(initialVisibility)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [savedNote, setSavedNote] = useState('')
  const [, startTransition] = useTransition()

  const isChoice = (format === 'single_choice' || format === 'binary') && options
  const isScale = format === 'scale_5'

  const value: AnswerValue | null = useMemo(() => {
    if (isChoice) return choice ? { kind: 'choice', selected: [choice] } : null
    if (isScale) return scale ? { kind: 'scale', value: Number(scale) as 1 | 2 | 3 | 4 | 5 } : null
    return text.trim() ? { kind: 'text', text } : null
  }, [isChoice, isScale, choice, scale, text])

  const [submitState, submitFormAction, submitting] = useActionState<DailyActionState, FormData>(
    submitAnswerAction,
    {},
  )

  // Debounced autosave for free text (spec §20 自動保存)
  useEffect(() => {
    if (submitted || !text.trim()) return
    const timer = setTimeout(() => {
      const data = new FormData()
      data.set('assignmentId', assignmentId)
      data.set('value', JSON.stringify({ kind: 'text', text }))
      data.set('visibility', visibility)
      startTransition(async () => {
        const result = await saveDraftAction({}, data)
        if (result.savedAt) setSavedNote('下書きを保存しました')
      })
    }, 1200)
    return () => clearTimeout(timer)
  }, [text, visibility, assignmentId, submitted])

  const buildFormData = () => {
    const data = new FormData()
    data.set('assignmentId', assignmentId)
    if (value) data.set('value', JSON.stringify(value))
    data.set('visibility', visibility)
    return data
  }

  return (
    <div className="space-y-5">
      {isChoice ? (
        <RadioGroup value={choice} onValueChange={setChoice} aria-label="選択肢">
          {options!.map((option) => (
            <Label
              key={option}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-card-sm border border-border bg-surface px-4 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent-soft/40"
            >
              <RadioGroupItem value={option} />
              {option}
            </Label>
          ))}
        </RadioGroup>
      ) : isScale ? (
        <RadioGroup
          value={scale}
          onValueChange={setScale}
          className="flex justify-between gap-2"
          aria-label="5段階評価"
        >
          {['1', '2', '3', '4', '5'].map((v) => (
            <Label
              key={v}
              className="flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-card-sm border border-border bg-surface font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent-soft/40"
            >
              <RadioGroupItem value={v} className="sr-only" />
              <span className="text-base font-semibold">{v}</span>
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="answer-text">あなたの答え</Label>
          <Textarea
            id="answer-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="思ったことを、そのまま書いて大丈夫です"
            disabled={submitted}
            maxLength={4000}
          />
          <p className="min-h-4 text-xs text-text-muted" role="status">
            {savedNote}
          </p>
        </div>
      )}

      <VisibilityPicker value={visibility} onChange={setVisibility} disabled={submitted} />

      {submitState.error ? (
        <p className="text-sm text-danger" role="alert">
          {submitState.error}
        </p>
      ) : null}

      {!submitted ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!value || submitting}>
              送信する
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>この内容で送信しますか？</DialogTitle>
              <DialogDescription>
                送信後も、二人の回答がそろうまでは書き直せます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                書き直す
              </Button>
              <Button
                disabled={submitting}
                onClick={() => {
                  setConfirmOpen(false)
                  const data = buildFormData()
                  startTransition(() => submitFormAction(data))
                }}
              >
                送信する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
