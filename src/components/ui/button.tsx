import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button variants follow docs/BRAND.md §3 — the fill says whose action it is.
 *
 *   primary   the blend      something the two do together (one per screen)
 *   brandA/B  the circles    "which of the two are you?" — registration only
 *   personA   blue side      something that belongs to you
 *   personB   pink side      something that belongs to your partner
 *   outline   neutral        secondary paths
 *   danger    orange-red     destructive, deliberately outside the brand hues
 *
 * The primary action is where two people start something together, so it is
 * built as an object you want to press (§4「主要ボタンの質感」): bold type on
 * a gradient with room to move, a 1px highlight along the top edge, a slow
 * drift, and a press that sinks instead of bouncing.
 */
const buttonVariants = cva(
  // min-h keeps every button a comfortable ≥44px tap target (spec §20)
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-card-sm px-5 text-[0.9375rem] font-bold tracking-[0.02em] transition-[background-color,box-shadow,transform,opacity,filter] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The logo itself, as a fill: 水色 → 紫 → ピンク. Dark ink, because
        // the mark's own colors are too light to carry white (§4).
        primary: [
          'bg-blend text-on-blend animate-blend-drift',
          'shadow-[0_1px_0_rgb(255_255_255/0.45)_inset,0_2px_10px_rgb(83_49_110/0.18)]',
          'hover:brightness-[1.03] hover:shadow-[0_1px_0_rgb(255_255_255/0.55)_inset,0_6px_20px_rgb(83_49_110/0.26)]',
          'active:scale-[0.985] active:shadow-[0_1px_2px_rgb(83_49_110/0.2)_inset]',
        ].join(' '),
        brandA: 'bg-brand-blue text-on-blend shadow-card hover:opacity-90 active:scale-[0.985]',
        brandB: 'bg-brand-pink text-on-blend shadow-card hover:opacity-90 active:scale-[0.985]',
        secondary: 'bg-primary text-primary-foreground hover:bg-primary-strong active:scale-[0.985]',
        outline: 'border border-border bg-surface text-text hover:bg-surface-muted active:scale-[0.985]',
        ghost: 'font-medium text-text hover:bg-surface-muted',
        soft: 'bg-together-soft text-primary hover:bg-surface-muted active:scale-[0.985]',
        personA: 'bg-person-a-soft text-person-a hover:opacity-90',
        personB: 'bg-person-b-soft text-person-b hover:opacity-90',
        danger: 'bg-danger text-white hover:opacity-90 active:scale-[0.985]',
        link: 'min-h-0 px-0 font-medium text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'min-h-11 px-4 text-sm',
        lg: 'min-h-14 rounded-card px-8 text-[1.0625rem]',
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
