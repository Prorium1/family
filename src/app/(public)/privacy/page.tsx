export const metadata = { title: 'プライバシーポリシー' }

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-5 px-4 py-12 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p>
        本アプリは、二人の親密な対話を扱うサービスとして、プライバシーを機能より優先して設計されています。
      </p>
      <h2 className="text-lg font-bold">収集する情報</h2>
      <p>
        表示名、メールアドレス、言語、タイムゾーン、および利用にともなう回答内容のみを収集します。生年月日、住所、勤務先などは収集しません。
      </p>
      <h2 className="text-lg font-bold">共有範囲はあなたが決めます</h2>
      <p>
        回答やRepairモードの記述には、5段階の共有範囲（自分だけ／AIだけ／AI要約のみ／選んだ文章だけ／原文共有）があります。意図しない内容がAIやパートナーに自動公開されることはありません。
      </p>
      <h2 className="text-lg font-bold">回答の同時公開</h2>
      <p>
        毎日の質問への回答は、二人の提出がそろうまでお互いに見えません。公開はサーバー側で制御され、ネットワーク経由でも公開前の相手の回答を取得できません。
      </p>
      <h2 className="text-lg font-bold">AIの利用と学習</h2>
      <p>
        AIには、あなたが共有を許可した情報だけが渡されます。AIモデルの学習への二次利用は初期状態でオフであり、明示的な同意なしに学習用途で使用することはありません。AIメモリーはいつでも確認・削除できます。
      </p>
      <h2 className="text-lg font-bold">ログと分析</h2>
      <p>
        AI処理のログには、処理種別・所要時間などのメタデータのみを保存し、回答の原文は保存しません。分析イベントに親密な文章、メールアドレス、氏名を含めることはありません。
      </p>
      <h2 className="text-lg font-bold">エクスポートと削除</h2>
      <p>
        ご自身のデータのエクスポートと削除申請は、いつでも無料で行えます。ペア解除後は、新しい共有データへのアクセスが双方で停止します。
      </p>
    </article>
  )
}
