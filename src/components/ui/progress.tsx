'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

/**
 * Progress fills with the logo gradient: the further the couple gets, the
 * more of the mark is revealed (docs/BRAND.md §4).
 */
export function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="bg-blend h-full w-full flex-1 transition-transform"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
