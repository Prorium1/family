import Link from 'next/link'
import { DEMO_USERS } from '@/lib/auth/demo-users'
import { cn } from '@/lib/utils'

/**
 * Demo-mode banner: switch between the two demo partners (and the third-party
 * persona) to walk the pairing → reveal experience from both sides.
 */
export function DemoSwitcher({ currentUserId }: { currentUserId: string | null }) {
  return (
    <div className="border-b border-warning/30 bg-warning-soft px-3 py-1.5 text-xs text-warning">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">デモモード</span>
        <span className="hidden sm:inline">視点を切り替え:</span>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_USERS.filter((u) => u.key !== 'admin').map((user) => (
            <Link
              key={user.id}
              href={`/api/demo/login?user=${user.key}&next=/home`}
              prefetch={false}
              aria-current={currentUserId === user.id ? 'true' : undefined}
              className={cn(
                'rounded-full border px-2.5 py-0.5',
                currentUserId === user.id
                  ? 'border-warning bg-warning text-warning-soft'
                  : 'border-warning/40 hover:bg-warning/10',
              )}
            >
              {user.displayName}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
