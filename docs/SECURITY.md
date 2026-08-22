# セキュリティとプライバシーの設計

このドキュメントは、`/privacy` に書いた約束が**コードのどこで守られているか**の対応表です。
主張ごとに「どこで」「どうやって」「どのテストが守っているか」を書いています。

---

## 1. 同時公開 — 公開前の回答は取得できない

| 層 | 実装 |
| --- | --- |
| ポリシー | `src/server/policies/assignment-policy.ts`（9状態の遷移と `canViewAnswer`） |
| リポジトリ | 相手の回答は公開前にペイロードへ入らない（`demo/conversations.ts` / `supabase/driver.ts`） |
| **データベース** | `answers_select` ポリシー: 自分の行 **または** 「メンバー かつ 公開済み」 |
| 公開処理 | `submit_answer_and_maybe_reveal()` が1トランザクションで実行。半公開状態は存在しない |

**本番DBでの実測**: 片方が提出した時点で、相手の本文は **0件**。両者提出後に双方から1件ずつ取得可能。

## 2. AIの同意 — 同意がなければ、1文字も送らない

- `hasAiProcessingConsent(userId)` / `coupleAllowsAiProcessing(coupleId)` — `settings-service.ts`
- 毎日のInsight: **二人ともの同意**が必要（`insight-service.ts` の2箇所でゲート）
- Repair: **書いた本人全員**の同意が必要（`repair-service.ts`）
- 同意がない場合は生成そのものを行わず、画面には「AIのメッセージはお休み中です」と表示
  （**どちらが同意していないかは表示しません**。それは本人の設定だからです）

## 3. 招待の秘密 — 生の値をDBに置かない

- リンクトークンと6桁コードは、`INVITATION_TOKEN_PEPPER` を鍵とする **HMAC-SHA256のみ**保存
- DBが丸ごと漏れても、招待を成立させることはできない
- 5回失敗で自動失効（`accept_couple_invitation()` 内でカウント）
- 有効期限48時間。ペア成立時、参加者側の未使用招待も自動失効
- `/join/{token}` は `Cache-Control: no-store` を返し、`Referrer-Policy` によりパスが外部に漏れない

## 4. 匿名で叩けるものを最小化

| RPC | anon | authenticated |
| --- | --- | --- |
| `peek_couple_invitation` | ✅（招待者の表示名とステージのみ） | ✅ |
| `accept_couple_invitation` | ❌ | ✅ |
| `submit_answer_and_maybe_reveal` | ❌ | ✅ |
| `claim_insight_generation` | ❌ | ✅ |
| `unpair_couple` | ❌ | ✅ |
| `is_active_couple_member` / `assignment_is_revealed` | ❌ | ✅ |

（`0010` / `0011`。Supabaseの既定権限が `anon` に開けていたものを閉じています）

## 5. 本文を保存しない場所

- `ai_generation_logs` — 種別・モデル・所要時間・成否のみ
- `analytics_events` — `FORBIDDEN_PROP_KEY_PATTERN` が本文・氏名・メールを含むキーを実行時に拒否
- `safety_events` — 検知の種別のみ。**きっかけの文章は保存しない**
- 上記4テーブル＋`audit_logs` は **RLS有効・ポリシー0件** = ユーザートークンでは誰も読めない

## 6. Repairの原文は本人だけのもの

- `repair_entries` は**行レベルで本人限定**（`repair_entries_author`）
- パートナーに届くのは、可視性ポリシーを通した要約や合意だけ
- 安全上の懸念がある内容では仲介を停止し、そのセッションはパートナーの一覧から消える

## 7. ブラウザに渡す制約（`next.config.ts`）

- `Content-Security-Policy`: 外部スクリプト・スタイル・フォント・フレームをすべて禁止。
  接続先は自サイトとSupabaseのみ（**解析ベンダーを黙って足せない**構造）
- `Strict-Transport-Security`: 1年 + preload
- `X-Frame-Options: DENY` / `frame-ancestors 'none'` — クリックジャッキング対策
- `Referrer-Policy: strict-origin-when-cross-origin` — 招待トークンを含むパスを外部に渡さない
- `Permissions-Policy` — カメラ・マイク・位置情報を明示的に無効化
- Cookieは `httpOnly` + `sameSite=lax` + 本番では `secure`

## 8. 濫用対策

- ログインリンク送信: メールアドレス単位 5回/15分、送信元単位 20回/15分（`lib/security/rate-limit.ts`）
- 招待コード: 5回失敗で失効
- プロンプトインジェクション: 規則ベースの検査で**モデルに届く前に**遮断し、
  ユーザー入力は常にデータとして境界で囲む（`wrapUserData`）
- AI出力も再検査し、点数化・断定を含む応答は失敗として扱う（`outputViolatesPrinciples`）

## 9. 退会

`0009` により、アカウント削除が実行可能であることを本番DBで確認済み。

- 個人のもの（回答、Repairの記述、その人についての項目）→ **一緒に消える**
- 二人のもの（約束、「私たち」の記録）→ **残り、作成者は匿名化される**

## 10. これは自動テストで守られています

- `src/tests/unit/` — ポリシー、可視性、同意ゲート、招待の秘密、ブランド規律
- `src/tests/e2e/` — 公開前に相手の本文がDOMにもエクスポートにも出ないこと、
  第三者の締め出し、安全停止時にパートナーへ何も出ないこと、QRからの実機ペアリング
