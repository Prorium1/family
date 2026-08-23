'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sunrise, Sprout, HeartHandshake, Compass, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/home', label: '今日', icon: Sunrise, match: ['/home', '/today'] },
  { href: '/journeys', label: '深める', icon: Sprout, match: ['/journeys', '/weekly-checkin'] },
  { href: '/repair', label: '整える', icon: HeartHandshake, match: ['/repair'] },
  { href: '/future', label: '未来', icon: Compass, match: ['/future', '/agreements', '/dates'] },
  {
    href: '/story',
    label: 'ふたり',
    icon: Users,
    match: ['/story', '/manual', '/we', '/notes', '/cycle'],
  },
] as const

/** Mobile bottom navigation (spec §6): 5 fixed tabs, ≥44px targets, safe-area aware. */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="メインナビゲーション"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-40 border-t pb-[var(--safe-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m))
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-text-muted hover:text-text',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
