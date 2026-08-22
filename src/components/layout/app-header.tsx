import Link from 'next/link'
import { Settings } from 'lucide-react'
import { BrandLockup } from '@/components/shared/brand-mark'

/** Compact mobile header inside the authed shell. */
export function AppHeader({ appName }: { appName: string }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 md:hidden">
      <Link href="/home" className="text-base">
        <BrandLockup name={appName} />
      </Link>
      <Link
        href="/settings/profile"
        aria-label="設定"
        className="flex size-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
      >
        <Settings className="size-5" aria-hidden="true" />
      </Link>
    </header>
  )
}
