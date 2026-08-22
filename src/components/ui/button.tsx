import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button variants follow docs/BRAND.md §3 — the fill says whose action it is.
 *
 *   primary   the blend      something the two do together (one per screen)
 *   personA   blue side      something that belongs to you
 *   personB   pink side      something that belongs to your partner
 *   outline   neutral        secondary paths
 *   danger    orange-red     destructive, deliberately outside the brand hues
 */
const buttonVariants = cva(
  // min-h keeps every button a comfortable ≥44px tap target (spec §20)
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-card-sm px-5 text-sm font-medium transition-[background-color,box-shadow,opacity] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The two minds mixing: a blue-leaning purple sliding into a
        // pink-leaning one. Both ends clear 4.5:1 against white.
        primary: 'bg-blend text-primary-foreground shadow-card hover:opacity-92',
        secondary: 'bg-primary text-primary-foreground hover:bg-primary-strong',
        outline: 'border border-border bg-surface text-text hover:bg-surface-muted',
        ghost: 'text-text hover:bg-surface-muted',
        soft: 'bg-together-soft text-primary hover:bg-surface-muted',
        personA: 'bg-person-a-soft text-person-a hover:opacity-90',
        personB: 'bg-person-b-soft text-person-b hover:opacity-90',
        danger: 'bg-danger text-white hover:opacity-90',
        link: 'min-h-0 px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'min-h-11 px-4 text-sm',
        lg: 'min-h-12 px-7 text-base',
        icon: 'min-h-11 w-11 px-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
