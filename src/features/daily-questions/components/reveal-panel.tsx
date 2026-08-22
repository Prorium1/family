import type { RevealedAnswerDTO } from '@/types/dto'
import type { AnswerValue } from '@/types/entities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BrandMark } from '@/components/shared/brand-mark'

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

/**
 * Both answers, shown only after the simultaneous reveal (spec §4-3).
 *
 * This is the moment the whole product is built around, so it is also where
 * the brand is most literal (docs/BRAND.md §3): the partner's card carries
 * their hue, yours carries yours, and the headline above them is the blend —
 * the thing the two of you just made together.
 */
export function RevealPanel({
  mine,
  partner,
}: {
  mine: RevealedAnswerDTO | null
  partner: RevealedAnswerDTO
}) {
  return (
    <div className="animate-gentle-rise space-y-3">
      <div className="bg-wash rounded-card px-4 py-4 text-center">
        <BrandMark className="mx-auto h-7 w-10" state="together" />
        <p className="text-blend mt-2 text-sm font-semibold">二人の答えがそろいました</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-person-b/25 bg-person-b-soft">
          <CardHeader>
            <CardTitle className="text-person-b text-sm">{partner.displayName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {renderValue(partner.value)}
            </p>
          </CardContent>
        </Card>
        {mine ? (
          <Card className="border-person-a/25 bg-person-a-soft">
            <CardHeader>
              <CardTitle className="text-person-a text-sm">{mine.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderValue(mine.value)}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
