import Link from 'next/link'
import { requireAdminSession } from '@/lib/auth/session'
import { appConfig } from '@/config/app'

/**
 * Admin surface. Content management only — no route in this tree can reach
 * users' intimate answer text (spec §6, §23): the repositories expose answers
 * exclusively through couple-member-scoped readers.
 */
export default async function AdminLayout({ children }: LayoutProps<'/'>) {
  await requireAdminSession()
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <p className="font-bold">
            {appConfig.name} <span className="text-text-muted">管理画面</span>
          </p>
          <nav aria-label="管理メニュー" className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:text-primary">概要</Link>
            <Link href="/admin/questions" className="hover:text-primary">質問</Link>
            <Link href="/admin/question-packs" className="hover:text-primary">パック</Link>
            <Link href="/admin/journeys" className="hover:text-primary">Journey</Link>
            <Link href="/admin/feature-flags" className="hover:text-primary">フラグ</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
