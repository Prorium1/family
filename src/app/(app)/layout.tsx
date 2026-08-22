import { requireSession } from '@/lib/auth/session'
import { isDemoMode } from '@/config/env'
import { DEMO_USERS } from '@/lib/auth/demo-users'
import { getRepositories } from '@/server/repositories'
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
  const demoNames = isDemoMode ? await readDemoNames() : {}
  return (
    <div className="flex min-h-dvh flex-col">
      {isDemoMode ? <DemoSwitcher currentUserId={session.userId} names={demoNames} /> : null}
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

/** Whatever the demo visitors have named themselves so far. */
async function readDemoNames(): Promise<Record<string, string>> {
  const repos = getRepositories()
  const entries = await Promise.all(
    DEMO_USERS.map(async (user) => [user.id, (await repos.profiles.getById(user.id))?.displayName ?? ''] as const),
  )
  return Object.fromEntries(entries)
}
