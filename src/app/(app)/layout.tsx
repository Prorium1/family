import { requireSession } from '@/lib/auth/session'
import { isDemoMode } from '@/config/env'
import { appConfig } from '@/config/app'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { DemoSwitcher } from '@/components/layout/demo-switcher'
import { AppHeader } from '@/components/layout/app-header'

/**
 * Authed shell. The redirect here is UX only — every server action and
 * repository call re-checks authorization on its own (spec §23).
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const session = await requireSession()
  return (
    <div className="flex min-h-dvh flex-col">
      {isDemoMode ? <DemoSwitcher currentUserId={session.userId} /> : null}
      <div className="flex flex-1">
        <SidebarNav appName={appConfig.name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader appName={appConfig.name} />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-2 pb-24 md:px-8 md:pt-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
