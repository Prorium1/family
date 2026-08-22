import Link from 'next/link'
import { appConfig } from '@/config/app'
import { Button } from '@/components/ui/button'
import { BrandLockup } from '@/components/shared/brand-mark'

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg">
            <BrandLockup name={appConfig.name} />
          </Link>
          <nav aria-label="公開ページ" className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/about">このアプリについて</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/pricing">料金</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">ログイン</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} {appConfig.name}</p>
          <nav aria-label="フッター" className="flex flex-wrap gap-4">
            <Link href="/safety" className="hover:text-text">安全への考え方</Link>
            <Link href="/privacy" className="hover:text-text">プライバシー</Link>
            <Link href="/terms" className="hover:text-text">利用規約</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
