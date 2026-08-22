import { allQuestions } from '@/content/questions'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: '質問管理' }

export default function AdminQuestionsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">質問（{allQuestions.length}）</h1>
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">質問</th>
              <th className="px-4 py-2.5 font-medium">カテゴリ</th>
              <th className="px-4 py-2.5 font-medium">形式</th>
              <th className="px-4 py-2.5 font-medium">感度</th>
              <th className="px-4 py-2.5 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {allQuestions.map((q) => (
              <tr key={q.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{q.id}</td>
                <td className="max-w-72 truncate px-4 py-2">{q.text}</td>
                <td className="px-4 py-2 text-xs">{q.category}</td>
                <td className="px-4 py-2 text-xs">{q.format}</td>
                <td className="px-4 py-2 text-xs">{q.sensitivity}</td>
                <td className="px-4 py-2">
                  {q.active ? <Badge variant="success">有効</Badge> : <Badge>停止</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
