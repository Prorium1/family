import Link from 'next/link'
import { PageTitle } from '@/components/shared/page-title'

const tabs = [
  { href: '/settings/profile', label: 'プロフィール' },
  { href: '/settings/couple', label: 'ふたり' },
  { href: '/settings/notifications', label: '通知' },
  { href: '/settings/privacy', label: 'プライバシー' },
  { href: '/settings/data', label: 'データ' },
  { href: '/settings/billing', label: 'プラン' },
] as const

export default function SettingsLayout({ children }: LayoutProps<'/settings'>) {
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="設定" />
      <nav aria-label="設定メニュー" className="mb-6 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium hover:bg-surface-muted"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
