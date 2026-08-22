import { ANY_PAIRING_NOTE, GENDER_OPTIONS } from '@/lib/ui/gender'
import { cn } from '@/lib/utils'
import type { Gender } from '@/types/domain'

/**
 * "Which of the two circles are you?" — the mark's blue and pink offered as
 * the two choices, plus a third, because two circles are two people and not
 * a binary (docs/BRAND.md §3.1). Plain HTML radios: it renders on the
 * server, works without JS, and reads correctly to a screen reader.
 */
export function GenderChoice({
  initial = null,
  legend = '性別',
  showNote = true,
  required = true,
}: {
  initial?: Gender | null
  legend?: string
  showNote?: boolean
  required?: boolean
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {GENDER_OPTIONS.map((option) => (
          <label key={option.value} className="block">
            <input
              type="radio"
              name="gender"
              value={option.value}
              defaultChecked={initial === option.value}
              required={required}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-11 items-center justify-center rounded-card-sm border border-border px-2 text-center text-sm',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                option.chipClass,
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {showNote ? <p className="text-xs text-text-muted">{ANY_PAIRING_NOTE}</p> : null}
    </fieldset>
  )
}
