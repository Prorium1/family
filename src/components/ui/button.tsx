import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // min-h keeps every button a comfortable ≥44px tap target (spec §20)
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-card-sm px-5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-strong',
        secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
        outline: 'border border-border bg-surface text-text hover:bg-surface-muted',
        ghost: 'text-text hover:bg-surface-muted',
        soft: 'bg-accent-soft text-accent-foreground hover:opacity-90',
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
