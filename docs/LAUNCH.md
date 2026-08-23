# ローンチ手順書

このアプリを「デモ」から「本番」へ切り替えるための、実際に検証済みの手順です。

---

## 1. いまどこまで本番か

| 層 | 状態 |
| --- | --- |
| アプリのコード | **本番品質**（ビルド・Lint・206ユニット・22 E2E がすべて green） |
| データベース | **本番用を作成済み・検証済み**（下記） |
| 本番サイト（`family-demo.vercel.app`） | **まだデモモード** — 環境変数を入れると切り替わります |
| メール送信（マジックリンク） | Supabase 既定のSMTP。**ローンチ前に独自SMTPへ**（§6） |
| AI | モック。本番キーを入れると実AIに切り替わります |

### デモモードの限界（重要）

デモモードのデータは、サーバーインスタンスごとの一時領域（`/tmp`）に保存されます。
Vercelは複数インスタンスで動くため、**2台のスマホが別インスタンスに当たると連携が見えません**。
デモは「一人が両方の席を切り替えて体験する」ためのものです。
**二人が別々の端末で本当に使うには、下記の切り替えが必要です。**

---

## 2. 本番データベース（作成・移行・検証すべて完了）

| 項目 | 値 |
| --- | --- |
| プロジェクト名 | `futari-production` |
| リージョン | `ap-northeast-1`（東京） |
| プロジェクトID | `gjrzghiyuxhbkjvypsig` |
| API URL | `https://gjrzghiyuxhbkjvypsig.supabase.co` |
| 適用済みマイグレーション | `0001` 〜 `0011` |
| 投入済みコンテンツ | 質問パック8・**質問127**・Journey5・ステップ60 |
| ユーザーデータ | 0件（検証用データは削除済み） |

---

## 3. Vercel に入れる環境変数

Vercel → プロジェクト `family-demo` → Settings → Environment Variables（Production）

```
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://gjrzghiyuxhbkjvypsig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TANYY4Vtm2Ea_7Ti4aRllg_vVyMoBqU
NEXT_PUBLIC_APP_URL=https://family-demo.vercel.app
INVITATION_TOKEN_PEPPER=<32バイト以上のランダム文字列を新規生成>
DATA_ENCRYPTION_KEY=<`openssl rand -base64 32` で生成した32バイト>
```

`DATA_ENCRYPTION_KEY` は、二人が書いた文章を暗号化する鍵です。
**デモモードを切ると、この鍵が無い限りアプリは起動しません**（黙って平文を保存するのが
最悪の失敗だからです）。**この鍵を失うと、保存済みの文章は永久に読めなくなります。**
他の重要な秘密情報と同じ場所に保管してください。
鍵を交換するときは、旧鍵を `DATA_ENCRYPTION_KEY_PREVIOUS` に残せば既存データも読めます。

`INVITATION_TOKEN_PEPPER` は招待トークンのHMAC鍵です。**必ず新しくランダム生成**してください
（例: `openssl rand -base64 48`）。一度決めたら変更しないでください。変更すると発行済みの
招待リンクとコードがすべて無効になります。

Supabaseダッシュボード（Settings → API）から取得して入れるもの:

```
SUPABASE_SERVICE_ROLE_KEY=<Supabaseの service_role キー>
```

これはサーバー専用です。`NEXT_PUBLIC_` を付けないでください。

AIを実運用にする場合（任意。未設定ならモックのまま安全に動きます）:

```
AI_MOCK_MODE=false
AI_PROVIDER=anthropic          # または openai
AI_MODEL=<モデルID>
AI_FALLBACK_PROVIDER=mock
ANTHROPIC_API_KEY=<キー>       # または OPENAI_API_KEY
```

保存したら **Redeploy**（環境変数はビルド時に取り込まれます）。

---

## 4. 切り替え後の確認（2分）

1. `https://family-demo.vercel.app/api/health` を開く
   ```json
   { "status": "ok", "mode": "supabase", "database": "ok", "ai": "mock" }
   ```
   `mode` が `demo` のままなら環境変数が反映されていません。
   `database` が `unreachable` ならURL/キーを確認してください。

2. Supabase → Authentication → URL Configuration に本番URLを登録
   - Site URL: `https://family-demo.vercel.app`
   - Redirect URLs: `https://family-demo.vercel.app/auth/callback`

3. **2台の実機で確認**（これが本番の合否）
   - 端末A: `/signup` → メールで登録 → 届いたリンクをタップ → 名前と性別を入力
   - 端末Aに招待QRが自動表示される（ボタンを探す必要はありません）
   - 端末B: `/pair` の**「QRを読み取る」でアプリ内カメラを起動**し、端末Aの画面を写す
     → 読み取った瞬間にペアリングが完了します（カメラアプリに切り替える必要はありません）
   - カメラを使わない場合: 招待リンクをタップ、または6桁コードを入力（`123・456` の
     表記のままでも、全角数字でも受け付けます）
   - **端末Aの画面が自動でホームに変わる**（リロード不要）
   - 二人で今日の質問に答える → 両方そろった瞬間に同時公開

   > iOSでカメラを使うにはHTTPSが必要です。本番ドメインでは問題ありませんが、
   > ローカルのIPアドレス（`http://192.168.x.x`）で試すとカメラだけが起動しません。
   > その場合もリンクとコードでのペアリングは動きます。

---

## 5. 検証済みの不変条件（本番DBで実測）

コードのテストではなく、**この本番データベースに対して実行した結果**です。

| 検証項目 | 結果 |
| --- | --- |
| 招待の受諾（RPC経由・生の秘密はDBに渡らない） | ✅ カップル成立 |
| **相手が回答を出す前に、相手の本文が読めないこと** | ✅ 0件（RLSが遮断） |
| 両者提出後の同時公開 | ✅ 双方が相手の回答を取得 |
| 第三者からの見え方（回答・カップル・NEW WE） | ✅ すべて0件 |
| 第三者に見えるもの | 質問カタログ127件のみ（意図通り） |
| アカウント削除 | ✅ 実行可能（`0009`で修正）。二人で作ったものは残り、作成者は匿名化 |
| 匿名で叩けるRPC | `peek_couple_invitation` のみ（`/join` の招待者名表示用） |
| 本文の暗号化（DBから読めないこと） | ✅ 実測: 保存値は `v1.…` の暗号文。本文の断片も一致しない |
| ペアリング・回答・解除のRPC | 匿名からは実行不可（`0010`/`0011`で封鎖） |

`ai_generation_logs` / `analytics_events` / `audit_logs` / `safety_events` は
**ポリシーを1つも持たない**設計です（RLS有効・ポリシーなし＝ユーザートークンでは誰も読めない）。
Supabaseのリンターが INFO で指摘しますが、意図通りです。

---

## 6. ローンチ前に残っていること

- [ ] **独自SMTP**（Resend / SendGrid など）を Supabase → Authentication → SMTP に設定
      既定のSMTPは1時間あたりの送信数が厳しく、本番のマジックリンクには使えません
- [ ] **独自ドメイン**を Vercel に接続し、`NEXT_PUBLIC_APP_URL` と Supabase の
      Redirect URLs を新ドメインに更新
- [ ] **AIの本番キー**（未設定ならモックのまま。安全ですが、AIの価値は出ません）
- [ ] メール文面の日本語化（Supabase → Authentication → Email Templates）
- [ ] 法務ページの最終確認（`/terms` `/privacy` `/safety`）と問い合わせ先の記載
- [ ] 監視: `/api/health` を外形監視に登録（Vercel / UptimeRobot など）
- [ ] Vercel Analytics か Sentry などのエラー監視

---

## 7. 障害時の戻し方

環境変数 `NEXT_PUBLIC_DEMO_MODE=true` に戻して Redeploy すれば、
外部依存ゼロのデモモードに即座に戻せます（本番データはそのまま残ります）。
