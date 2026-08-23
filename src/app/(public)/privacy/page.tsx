import Link from 'next/link'
import { appConfig } from '@/config/app'

export const metadata = { title: 'プライバシーポリシー' }

const LAST_UPDATED = '2026年8月22日'

/**
 * The privacy page is a promise, so it is written to be checkable: every
 * claim here corresponds to something enforced in code or in the database,
 * and docs/SECURITY.md says where. Vague reassurance would be worse than
 * saying nothing.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 px-4 py-12 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
        <p className="text-text-muted">最終更新: {LAST_UPDATED}</p>
      </header>

      <p className="bg-wash rounded-card px-5 py-4">
        {appConfig.name}は、二人の最も個人的な言葉をお預かりします。 ここに書いたことは、すべて
        <strong>コードとデータベースで実際に守られている</strong>ことだけです。
        「努力します」ではなく「そうなっています」と言える範囲だけを書いています。
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">1. 集める情報 / 集めない情報</h2>
        <p>
          <strong>集めるもの</strong>:
          メールアドレス、表示名、性別（任意・「答えない」を選べます）、
          言語とタイムゾーン、あなたが書いた回答や記述、二人で保存した「私たち」の記録、
          二人が登録した予定（記念日など）とメモ、送り合った「ひとことサイン」の種類と時刻。
        </p>
        <p>
          <strong>からだの周期（任意）</strong>:
          記録した場合のみ保存される、心身の状態に関わる情報です。日付は暗号化して保存し、
          パートナーへの共有は<strong>あなたがオンにするまで行われません</strong>
          （オンにするまで、記録の存在自体が相手に伝わりません）。共有はいつでも解除でき、
          記録は1件ずつ削除できます。この情報をAIの分析や広告に使うことはありません。
        </p>
        <p>
          <strong>集めないもの</strong>:
          生年月日、住所、電話番号、勤務先、位置情報、連絡先へのアクセス、
          広告ID。第三者の広告トラッカーは1つも入っていません。
        </p>
        <p>
          <strong>カメラについて</strong>:
          パートナーのQRコードを読み取るときだけ、あなたの許可を得てカメラを使います。
          映像はあなたの端末の中だけで読み取られ、
          <strong>撮影されず、送信されず、保存もされません</strong>。
          読み取った結果として送られるのは招待コードだけです。カメラを使いたくない場合は、
          招待リンクまたは6桁のコードでも同じようにつながれます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">2. 回答は、二人がそろうまで誰にも見えません</h2>
        <p>
          毎日の質問への回答は、二人の提出がそろって初めて同時に公開されます。
          これは画面上の演出ではなく、<strong>データベースの行レベルセキュリティ</strong>
          で強制しています。 公開前は、たとえAPIを直接叩いても相手の回答は1件も返りません。
          公開は1つのトランザクションで行われ、「片方だけ見えている」状態は存在しません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">3. 共有範囲は、書くたびにあなたが選びます</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>自分だけ</strong> — パートナーにもAIにも渡りません
          </li>
          <li>
            <strong>AIだけ</strong> — AIは読みますが、パートナーには渡りません
          </li>
          <li>
            <strong>AIの要約のみ</strong> — 原文ではなく、中立的な要約だけが相手に届きます
          </li>
          <li>
            <strong>選んだ文章だけ</strong> — あなたが選んだ部分だけが共有されます
          </li>
          <li>
            <strong>原文を共有</strong>
          </li>
        </ul>
        <p>初期値は常に安全側です。意図しない公開は起こりません。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">4. AIに渡るもの、渡らないもの</h2>
        <p>
          AIによる分析は、<strong>二人ともが同意しているときだけ</strong>動きます。
          どちらかが同意していない場合、<strong>回答は一切AIに送信されません</strong>
          （片方の分だけ送ることもしません）。同意しなくても、同時公開・記録・約束など
          AI以外のすべての機能をお使いいただけます。
        </p>
        <p>
          AIには、あなたが選んだ共有範囲の情報だけが渡ります。
          <strong>AIの処理ログには原文を保存しません</strong>（処理の種類、所要時間、成否などの
          メタデータのみ）。分析イベントに本文・氏名・メールアドレスを含めることはありません。
        </p>
        <p>
          <strong>AIモデルの学習への利用は初期状態でオフ</strong>
          です。設定画面でいつでも変更できます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">5. どこに保存され、誰が扱うか</h2>
        <p>
          データは<strong>日本国内（東京リージョン）のデータベース</strong>に保存され、
          通信はすべてTLSで暗号化、保存時もディスク暗号化されています。
          サービス提供のために次の事業者を利用します。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong>（データベース・認証。保存先: 東京 / AWS）
          </li>
          <li>
            <strong>Vercel</strong>（アプリの配信）
          </li>
          <li>
            <strong>AI提供事業者</strong>（AI分析に同意した場合のみ。 処理のために
            <strong>国外へ送信される場合があります</strong>。
            送るのは共有範囲内の文章のみで、氏名・メールアドレスは送りません）
          </li>
        </ul>
        <p>これ以外の第三者に、あなたの文章を渡すことはありません。販売もしません。</p>
        <p>
          <strong>あなたが書いた文章は、暗号化して保存されます。</strong>
          復号のための鍵はデータベースとは別の場所にあるため、
          万一データベースの内容が流出しても、そのままでは読めません。
        </p>
        <p className="rounded-card border-border border px-4 py-3">
          <strong>正直にお伝えします。</strong>
          アプリを運用する私たちは、技術的には復号できる立場にあります
          （AIが二人の言葉を通訳するために、サーバー側で読める必要があるためです）。 そのうえで、
          <strong>通常の運用で私たちが本文を閲覧することはありません</strong>。
          管理画面には本文を表示する機能そのものがなく、
          データベースに触れられる人数は最小限に限定しています。
          「読めません」ではなく「読める立場だが、読まない仕組みにしている」——
          これが今の私たちの正確な説明です。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">6. 保存期間</h2>
        <p>
          アカウントがある間は保存され、<strong>削除するとあなたの文章は消えます</strong>。
          二人で作った記録（約束や「私たち」）は、もう一方のものでもあるため関係の記録として残り、
          <strong>作成者の情報は匿名化</strong>されます。
          安全に関する記録（本文は含みません）は、悪用防止のため最大1年間保持します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">7. 安全が最優先される場合</h2>
        <p>
          暴力・脅迫・強制など危険の兆候がある内容を検知したとき、アプリは仲直りの支援を止め、
          安全の確保と相談先の案内を優先します。このとき
          <strong>パートナーへの自動通知は行いません</strong>。
          あなたが危険にさらされることのないよう、通知の文面に争いの内容を書くこともしません。
          記録されるのは検知の種別のみで、<strong>きっかけとなった文章は保存しません</strong>。
        </p>
        <p>
          <Link href="/safety" className="text-primary underline">
            安全への考え方を読む
          </Link>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">8. あなたの権利</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>データのエクスポート（いつでも・無料）</li>
          <li>アカウントとデータの削除（いつでも・無料）</li>
          <li>ペア解除（相手の同意は不要です）</li>
          <li>AI分析・AI学習への同意の変更</li>
          <li>AIが覚えた項目の確認・修正・削除</li>
        </ul>
        <p>
          <strong>これらが有料になることはありません。</strong>
          「やめにくくすることで続けさせる」設計を、このプロダクトは採用しません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">9. お問い合わせ</h2>
        <p>
          プライバシーに関するご質問・開示や削除のご請求は、アプリ内の設定画面、または
          運営者の問い合わせ窓口までご連絡ください。
        </p>
      </section>
    </article>
  )
}
