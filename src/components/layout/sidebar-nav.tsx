'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sunrise, Sprout, HeartHandshake, Compass, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLockup } from '@/components/shared/brand-mark'

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

/** Desktop sidebar mirroring the bottom nav (spec §6). */
export function SidebarNav({ appName }: { appName: string }) {
  const pathname = usePathname()
  return (
    <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r px-4 py-6 md:flex">
      <Link href="/home" className="mb-8 px-2 text-lg">
        <BrandLockup name={appName} />
      </Link>
      <nav aria-label="メインナビゲーション" className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-card-sm flex min-h-11 items-center gap-3 px-3 text-sm font-medium',
                active
                  ? 'bg-together-soft text-primary'
                  : 'text-text-muted hover:bg-surface-muted hover:text-text',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
      <Link
        href="/settings/profile"
        className="rounded-card-sm text-text-muted hover:bg-surface-muted hover:text-text flex min-h-11 items-center gap-3 px-3 text-sm font-medium"
      >
        <Settings className="size-5" aria-hidden="true" />
        設定
      </Link>
    </aside>
  )
}
