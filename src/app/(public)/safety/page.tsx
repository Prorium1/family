import { getSafetyResources } from '@/content/safety-resources'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: '安全への考え方' }

export default function SafetyPage() {
  const resources = getSafetyResources('JP')
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <article className="space-y-4 leading-relaxed">
        <h1 className="text-2xl font-bold">安全への考え方</h1>
        <p>
          このアプリは、カップルを無理に「仲直り」させるためのものではありません。暴力、脅迫、性的強要、監視、ストーカー行為、金銭的支配、強い恐怖、自傷や自殺の可能性がある状況では、通常の仲直りの提案を停止し、あなたの安全を最優先します。
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-text-muted">
          <li>無理な話し合いや対面をお勧めしません</li>
          <li>信頼できる第三者や専門機関への相談をご案内します</li>
          <li>あなたが書いた内容を、パートナーへ自動で通知することはありません</li>
          <li>通知の文面に、争いの内容が含まれることはありません</li>
        </ul>
      </article>

      <section>
        <h2 className="text-lg font-bold">相談窓口</h2>
        <p className="mt-1 text-sm text-text-muted">
          緊急時は、ためらわずに110番・119番へ連絡してください。
        </p>
        <div className="mt-4 space-y-3">
          {resources.map((r) => (
            <Card key={r.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {r.name}
                  {r.urgent ? <Badge variant="danger">緊急</Badge> : null}
                </CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold tracking-wide">{r.contact}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
