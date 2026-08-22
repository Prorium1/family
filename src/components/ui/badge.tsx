import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Badge colors carry attribution, not decoration (docs/BRAND.md §3):
 * personA/personB mark whose status a chip describes, `together` marks
 * something the couple produced jointly.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-surface-muted text-text',
        together: 'border-transparent bg-together-soft text-primary',
        personA: 'border-transparent bg-person-a-soft text-person-a',
        personB: 'border-transparent bg-person-b-soft text-person-b',
        primary: 'border-transparent bg-primary text-primary-foreground',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-warning-soft text-warning',
        danger: 'border-transparent bg-danger-soft text-danger',
        outline: 'border-border text-text-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
