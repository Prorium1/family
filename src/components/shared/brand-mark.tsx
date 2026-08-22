import geometry from '@/config/mark-geometry.json'
import { cn } from '@/lib/utils'

/**
 * The brand mark: two golden-ratio circles, each with a head above it,
 * overlapping into a lens. One gradient runs through all of it — YOU on
 * the left, ME on the right, WE where they meet.
 *
 * Every coordinate comes from src/config/mark-geometry.json, the same file
 * scripts/generate-icons.mjs draws from, so the logo, the app icon and the
 * design tokens can never drift apart (docs/BRAND.md §1.1).
 *
 * `state` reflects where the couple is in the daily loop:
 *   apart     the two circles sit at rest
 *   waiting   the lens breathes while one answer is still missing
 *   together  the lens is at full strength — both answers are in
 */
const {
  radius,
  centerLeftX,
  centerRightX,
  centerY,
  headRadius,
  headCenterY,
  strokeWidth,
  gradientX1,
  gradientX2,
  viewBox,
} = geometry

/** The five stops of the mark, evenly spaced so the ramp has no seam. */
const STOPS = [
  { offset: '0%', color: 'var(--brand-blue)' },
  { offset: '30%', color: 'var(--brand-blue-violet)' },
  { offset: '50%', color: 'var(--brand-purple)' },
  { offset: '70%', color: 'var(--brand-magenta)' },
  { offset: '100%', color: 'var(--brand-pink)' },
]

export function BrandMark({
  className,
  state = 'apart',
  title,
}: {
  className?: string
  state?: 'apart' | 'waiting' | 'together'
  title?: string
}) {
  const lensOpacity = state === 'together' ? 1 : 0.62
  // one id per state so several marks can share a page safely
  const uid = `mark-${state}`
  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={cn('block', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* one gradient across the whole mark, in user space: each circle
            turns violet exactly where it enters the other */}
        <linearGradient
          id={`${uid}-blend`}
          gradientUnits="userSpaceOnUse"
          x1={gradientX1}
          y1={0}
          x2={gradientX2}
          y2={0}
        >
          {STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        {/* the lens is the exact intersection of the two discs */}
        <clipPath id={`${uid}-left`}>
          <circle cx={centerLeftX} cy={centerY} r={radius} />
        </clipPath>
        <clipPath id={`${uid}-right`}>
          <circle cx={centerRightX} cy={centerY} r={radius} />
        </clipPath>
      </defs>

      {/* only what the two share carries fill — that is the NEW WE */}
      <g
        className={state === 'waiting' ? 'animate-lens-breathe' : undefined}
        opacity={lensOpacity}
        clipPath={`url(#${uid}-left)`}
      >
        <g clipPath={`url(#${uid}-right)`}>
          <rect
            x={centerLeftX - radius}
            y={centerY - radius}
            width={centerRightX - centerLeftX + radius * 2}
            height={radius * 2}
            fill={`url(#${uid}-blend)`}
          />
        </g>
      </g>

      {/* the two circles, open: each person keeps their own outline */}
      <circle
        cx={centerLeftX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={`url(#${uid}-blend)`}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={centerRightX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={`url(#${uid}-blend)`}
        strokeWidth={strokeWidth}
      />

      {/* the heads: solid, never gradient — each person is themselves */}
      <circle cx={centerLeftX} cy={headCenterY} r={headRadius} fill="var(--brand-blue)" />
      <circle cx={centerRightX} cy={headCenterY} r={headRadius} fill="var(--brand-pink)" />
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
      <BrandMark className="h-6 w-auto" state={state} />
      <span className="text-blend font-bold">{name}</span>
    </span>
  )
}
