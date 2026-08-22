import { featureFlags } from '@/config/features'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'フィーチャーフラグ' }

export default function AdminFlagsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">フィーチャーフラグ</h1>
      <ul className="space-y-2">
        {Object.entries(featureFlags).map(([key, enabled]) => (
          <li
            key={key}
            className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 text-sm"
          >
            <code>{key}</code>
            {enabled ? <Badge variant="success">ON</Badge> : <Badge>OFF</Badge>}
          </li>
        ))}
      </ul>
    </div>
  )
}
