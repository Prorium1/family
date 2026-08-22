import { allQuestions, questionPacks } from '@/content/questions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = { title: '質問パック管理' }

export default function AdminPacksPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">質問パック</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {questionPacks.map((pack) => (
          <Card key={pack.id}>
            <CardHeader>
              <CardTitle className="text-base">{pack.title}</CardTitle>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-text-muted">
              {allQuestions.filter((q) => q.packId === pack.id).length}問
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
