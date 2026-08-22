'use client'

import { useActionState } from 'react'
import {
  submitCheckinAction,
  type CheckinActionState,
} from '@/server/actions/checkin-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function CheckinForm({
  checkinId,
  questions,
  initialAnswers,
}: {
  checkinId: string
  questions: Array<{ id: string; text: string }>
  initialAnswers: Array<{ questionId: string; text: string }> | null
}) {
  const [state, formAction, pending] = useActionState<CheckinActionState, FormData>(
    submitCheckinAction,
    {},
  )
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="checkinId" value={checkinId} />
      {questions.map((question) => (
        <div key={question.id} className="space-y-1.5">
          <Label htmlFor={`checkin-${question.id}`}>{question.text}</Label>
          <Textarea
            id={`checkin-${question.id}`}
            name={`answer:${question.id}`}
            defaultValue={initialAnswers?.find((a) => a.questionId === question.id)?.text ?? ''}
            className="min-h-20"
            maxLength={2000}
          />
        </div>
      ))}
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        今週の回答を送信する
      </Button>
    </form>
  )
}
