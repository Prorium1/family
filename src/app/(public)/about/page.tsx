import { appConfig } from '@/config/app'

export const metadata = { title: 'このアプリについて' }

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 px-4 py-12 leading-relaxed">
      <h1 className="text-2xl font-bold">このアプリについて</h1>
      <blockquote className="border-l-4 border-accent pl-4 text-text-muted italic">
        世界を幸せにしたい人が、一番近くの人を幸せにできている。
        <br />
        その状態は、ものすごく美しい。
      </blockquote>
      <p>
        {appConfig.name}は、恋人から結婚、夫婦、家族へと関係を育てていくための「Family
        OS」です。単なる質問アプリでも、相性診断でもありません。
      </p>
      <p className="font-medium">
        自分を知る。相手を知る。二人を育てる。家族を育てる。
        <br />
        その幸せが、世界へ広がっていく。
      </p>
      <p>
        私たちは「別れないこと」を絶対的な正解にしません。目指すのは、避けられたはずのすれ違いや、言葉不足による別れを減らすこと。そして、危険な関係では関係の継続よりも安全を優先できることです。
      </p>
      <h2 className="text-lg font-bold">AIの役割</h2>
      <p>
        このアプリのAIは「二人の愛の通訳者」です。どちらが正しいかを決めず、感情を整理し、相手に伝わりやすい言葉へ翻訳し、二人の共通目的を見つけ、次にできる小さな行動をひとつ提案します。相性の点数化は行いません。
      </p>
    </article>
  )
}
