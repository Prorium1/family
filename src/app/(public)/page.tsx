import Link from 'next/link'
import { appConfig } from '@/config/app'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { MessagesSquare, ShieldCheck, Sparkles, Lock, Handshake } from 'lucide-react'
import { BrandMark } from '@/components/shared/brand-mark'

/** Landing page (spec §35). Warm, honest, and free of fear marketing. */
export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-wash">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
          <BrandMark className="mb-6 h-16 w-auto" state="together" />
          <p className="text-blend text-sm font-bold tracking-[0.2em]">YOU + ME → WE</p>
          <h1 className="mt-3 text-2xl leading-relaxed font-bold sm:text-3xl">
            違うから、知りたくなる。
            <br />
            知るから、わかり合える。
            <br />
            そして、新しい「私たち」が生まれる。
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-muted">
            毎日5分。愛のあるAIと一緒に、
            <br className="sm:hidden" />
            二人だけの答えをつくっていく Relationship OS。
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">ふたりではじめる</Link>
          </Button>
          <p className="mt-3 text-xs text-text-muted">
            登録は60秒。パートナーは届いたリンクをタップするだけで参加できます。
            <br />
            男性同士・女性同士でも、まったく同じようにお使いいただけます。
          </p>
        </div>
      </section>

      {/* こんなことはありませんか */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-xl font-bold">こんなことはありませんか</h2>
        <ul className="mx-auto mt-6 grid max-w-xl gap-3 text-sm text-text-muted">
          {[
            '言いたいことがあるのに、タイミングを逃してしまう',
            '相手の考えを、聞く前に決めつけてしまうことがある',
            '結婚や将来の話を、どう切り出せばいいか分からない',
            '喧嘩のあと、どう戻ればいいか分からなくなる',
          ].map((item) => (
            <li key={item} className="rounded-card bg-surface px-5 py-3.5 shadow-card">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* アプリでできること */}
      <section className="bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h2 className="text-center text-xl font-bold">{appConfig.name}でできること</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: MessagesSquare,
                title: '毎日ひとつの質問',
                body: '3〜5分で答えられる質問が毎日届きます。二人が答えると同時に公開されるから、相手の答えに合わせる必要はありません。',
              },
              {
                icon: Sparkles,
                title: '愛のあるAI',
                body: 'AIはどちらが正しいかを決めません。二人の言葉を整理して、伝わりやすい形に通訳します。相性の点数付けは一切ありません。',
              },
              {
                icon: ShieldCheck,
                title: '安全を最優先',
                body: '危険を感じる状況では、仲直りより先にあなたの安全を優先します。パートナーへの自動通知は行いません。',
              },
              {
                icon: Handshake,
                title: '二人だけの第三の答え',
                body: '「価値観が違います」で終わりません。どちらにも合わせない、二人の言葉でつくる答えを一緒に下書きします。決めるのはいつも二人です。',
              },
              {
                icon: Lock,
                title: 'プライバシー第一',
                body: '書いたことをどこまで共有するかは、いつもあなたが選べます。自分だけ・AIだけ・要約のみ・原文共有の5段階です。',
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-text-muted">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* YOU + ME → WE の5ステップ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-xl font-bold">二人の違いが、答えに変わるまで</h2>
        <ol className="mt-8 space-y-3">
          {[
            { step: 'KNOW ME', title: '自分を知る', body: '毎日ひとつの質問に、まず自分の言葉で答えます。' },
            { step: 'KNOW YOU', title: '相手を知る', body: '二人がそろって初めて、同時に公開されます。合わせる必要はありません。' },
            { step: 'EXCHANGE', title: '価値観を交換する', body: '同じ問いへの、違う答え。そこがいちばん知り合える場所です。' },
            { step: 'UNDERSTAND', title: 'なぜ違うのかを理解する', body: 'AIがどちらも裁かずに、何を大切にしているのかを整理します。' },
            { step: 'BUILD WE', title: '二人だけの答えをつくる', body: 'どちらかに合わせるのではなく、両方が残る第三の答えを「私たち」に残します。' },
          ].map(({ step, title, body }, index) => (
            <li key={step} className="flex gap-4 rounded-card bg-surface px-5 py-4 shadow-card">
              <span className="text-blend shrink-0 text-sm font-bold">{index + 1}</span>
              <div>
                <p className="text-xs font-bold tracking-widest text-text-muted">{step}</p>
                <p className="mt-0.5 font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-center text-sm text-text-muted">
          積み上がるのは相性のスコアではなく、
          <span className="text-primary font-semibold">「私たちとは何か」</span>です。
        </p>
      </section>

      {/* 今日の質問の体験 */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-xl font-bold">今日の質問の体験</h2>
        <div className="mx-auto mt-6 max-w-md space-y-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-text-muted">今日のふたり</p>
              <p className="mt-1 font-medium">「最近、相手に一番感謝したことは？」</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-text-muted">
                あなたの回答は届きました。
                <br />
                パートナーの回答を待っています。
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-wash">
            <CardContent className="pt-5">
              <p className="text-blend text-sm font-semibold">二人の答えがそろいました。</p>
              <p className="mt-1 text-xs text-text-muted">愛の通訳から、二人へのメッセージが届きます。</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 結婚前に話しておきたいこと */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-xl font-bold">結婚前に話しておきたいことを、二人のペースで</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
            お金、住まい、子ども、両親との関係、喧嘩のルール。「結婚前に話す30の質問」が、
            切り出しにくいテーマを二人のペースで話せる形にします。
          </p>
        </div>
      </section>

      {/* プライバシーと安全 */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>プライバシー</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-text-muted">
              回答は、二人がそろって初めて公開されます。共有範囲はあなたが選び、意図しない公開は起こりません。データのエクスポートと削除はいつでも無料です。
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>安全への考え方</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-text-muted">
              このアプリは「別れないこと」を正解にしません。危険や恐怖があるときは、関係の継続よりあなたの安全を優先し、専門の相談先をご案内します。
              <Link href="/safety" className="mt-2 block text-primary underline">
                詳しく読む
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 料金 */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-xl font-bold">料金</h2>
          <p className="mt-3 text-sm text-text-muted">
            基本機能は無料。プレミアムはカップル単位のひとつのプランです。
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/pricing">料金の詳細</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-14">
        <h2 className="text-center text-xl font-bold">よくある質問</h2>
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="q1">
            <AccordionTrigger>相手の回答を先に見ることはできますか？</AccordionTrigger>
            <AccordionContent>
              できません。二人の回答がそろって初めて、同時に公開されます。片方が相手の答えを見てから自分の答えを変えることがない設計です。
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>AIに相性を判定されるのは嫌です。</AccordionTrigger>
            <AccordionContent>
              このアプリのAIは相性を点数化しません。違いを「悪いこと」として扱わず、二人が話し合うための整理と翻訳に徹します。
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>書いた内容はすべて相手に見られますか？</AccordionTrigger>
            <AccordionContent>
              いいえ。共有範囲は5段階からあなたが選べます。「自分だけ」「AIだけ」「AIの要約のみ」「選んだ文章だけ」「原文を共有」です。
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>同性のカップルでも使えますか？</AccordionTrigger>
            <AccordionContent>
              はい。登録時に選ぶ性別は自己紹介のためだけのもので、組み合わせに制限はありません。
              質問もAIのメッセージも、どの二人にも同じように届きます。
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger>途中でやめたくなったら？</AccordionTrigger>
            <AccordionContent>
              ペア解除、データのエクスポート、削除申請はいつでも無料でできます。これらの機能が有料になることはありません。
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* CTA */}
      <section className="bg-wash">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold">
今日の5分から、二人の答えをつくりはじめよう。
          </h2>
          <Button asChild size="lg" variant="primary" className="mt-6">
            <Link href="/signup">ふたりではじめる</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
