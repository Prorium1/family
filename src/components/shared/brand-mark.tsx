import { cn } from '@/lib/utils'

/**
 * The brand mark: two translucent circles overlapping into a lens.
 * Drawn from the same measured values as the design tokens
 * (docs/BRAND.md §1) so the logo and the UI can never drift apart.
 *
 * `state` reflects where the couple is in the daily loop:
 *   apart     the circles sit at rest
 *   waiting   the overlap breathes while one answer is still missing
 *   together  the overlap is at full strength — both answers are in
 */
export function BrandMark({
  className,
  state = 'apart',
  title,
}: {
  className?: string
  state?: 'apart' | 'waiting' | 'together'
  title?: string
}) {
  const lensOpacity = state === 'together' ? 1 : 0.6
  // one id per instance so several marks can share a page safely
  const uid = `mark-${state}`
  return (
    <svg
      viewBox="0 0 64 44"
      className={cn('block', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* one gradient across the whole mark: each circle turns violet
            exactly where it enters the other */}
        <linearGradient id={`${uid}-stroke`} x1="9" y1="0" x2="55" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-blue)" />
          <stop offset="50%" stopColor="var(--brand-purple)" />
          <stop offset="100%" stopColor="var(--brand-pink)" />
        </linearGradient>
        {/* the lens is the intersection of the two discs */}
        <clipPath id={`${uid}-lens`}>
          <circle cx="24" cy="22" r="15" />
        </clipPath>
      </defs>

      {/* only what the two share carries fill */}
      <g
        className={state === 'waiting' ? 'animate-lens-breathe' : undefined}
        opacity={lensOpacity}
      >
        <circle cx="40" cy="22" r="15" fill="var(--brand-purple)" clipPath={`url(#${uid}-lens)`} />
      </g>

      <circle
        cx="24"
        cy="22"
        r="15"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="2.5"
      />
      <circle
        cx="40"
        cy="22"
        r="15"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="2.5"
      />
    </svg>
  )
}

/** The mark plus the product name, locked up as one unit. */
export function BrandLockup({
  name,
  className,
  state = 'apart',
}: {
  name: string
  className?: string
  state?: 'apart' | 'waiting' | 'together'
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <BrandMark className="h-5 w-7" state={state} />
      <span className="text-blend font-bold">{name}</span>
    </span>
  )
}
