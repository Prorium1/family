import type { RevealedAnswerDTO } from '@/types/dto'
import type { AnswerValue } from '@/types/entities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function renderValue(value: AnswerValue): string {
  switch (value.kind) {
    case 'text':
      return value.text
    case 'choice':
      return value.selected.join('、')
    case 'scale':
      return `5段階中 ${value.value}`
    case 'ranking':
      return value.ordered.map((v, i) => `${i + 1}. ${v}`).join(' / ')
  }
}

/** Both answers, shown only after the simultaneous reveal (spec §4-3). */
export function RevealPanel({
  mine,
  partner,
}: {
  mine: RevealedAnswerDTO | null
  partner: RevealedAnswerDTO
}) {
  return (
    <div className="animate-gentle-rise space-y-3">
      <p className="rounded-card bg-accent-soft px-4 py-3 text-center text-sm font-semibold text-accent-foreground">
        二人の答えがそろいました
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[partner, mine].filter(Boolean).map((answer) => (
          <Card key={answer!.userId}>
            <CardHeader>
              <CardTitle className="text-sm text-text-muted">{answer!.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderValue(answer!.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
