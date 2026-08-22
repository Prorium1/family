export const metadata = { title: '利用規約' }

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-5 px-4 py-12 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <h2 className="text-lg font-bold">第1条（利用資格）</h2>
      <p>本サービスは18歳以上の方のみ利用できます。</p>
      <h2 className="text-lg font-bold">第2条（サービスの性質）</h2>
      <p>
        本サービスは、パートナー間のコミュニケーションを支援するツールです。AIによる提案は医療・心理療法・法律の専門的助言ではありません。専門的判断が必要な場合は、適切な専門家へご相談ください。
      </p>
      <h2 className="text-lg font-bold">第3条（禁止事項）</h2>
      <p>
        他者へのなりすまし、他のユーザーの情報を取得する試み、システムへの不正アクセス、その他法令に違反する行為を禁止します。
      </p>
      <h2 className="text-lg font-bold">第4条（データの取り扱い）</h2>
      <p>
        データの取り扱いはプライバシーポリシーに従います。データのエクスポート・削除、ペア解除は無料で提供され続けます。
      </p>
      <h2 className="text-lg font-bold">第5条（免責）</h2>
      <p>
        本サービスは、関係の継続・成立を保証するものではありません。安全に関わる緊急の状況では、警察・救急などの公的機関へ直接ご連絡ください。
      </p>
    </article>
  )
}
