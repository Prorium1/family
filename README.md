# Futari — 二人の会話を、未来につなげる Family OS

恋人から結婚、夫婦、家族へ。二人の関係を、感情任せにせず、愛を持って育て続けるための
モバイルファーストWebアプリ / PWAです。

> 自分を知る。相手を知る。二人を育てる。家族を育てる。
> その幸せが、世界へ広がっていく。

アプリ名は `NEXT_PUBLIC_APP_NAME` で変更できます（コードに直書きされていません）。

---

## ✨ 何ができるか

| 循環 | 機能 |
| --- | --- |
| 話す | 毎日1問（3〜5分）。二人が提出して初めて**同時公開** |
| 知る | AI「愛の通訳」による構造化された気づき（相性の点数化はしない） |
| 整える | Repair Mode — 気持ちの整理・中立的な要約・話し合いの順番。危険時は安全最優先 |
| 未来を決める | 5カテゴリの人生設計と「二人の約束」（改訂履歴つき） |
| 積み重ねる | ふたりページ・タイムライン・ふたりの取扱説明書（AIメモリーは全て確認/削除可能） |

### 非交渉の設計原則

- **相性を点数化しない** — AIは裁判官にならない
- **同時公開** — 相手の回答は、二人が提出するまでネットワーク経由でも取得不能（サーバー側で強制）
- **5段階の共有範囲** — 自分だけ / AIだけ / AI要約のみ / 選んだ文章だけ / 原文共有
- **安全最優先** — 高リスク検知で通常フローを停止し、相談窓口を提示。パートナーへの自動通知はしない
- **エクスポート・削除・ペア解除・プライバシー・安全機能は永久に無料**

---

## 🚀 クイックスタート（デモモード・外部キー不要）

```bash
pnpm install
cp .env.example .env.local   # デフォルトで DEMO_MODE=true / AI_MOCK_MODE=true
pnpm dev
```

http://localhost:3000 を開き、画面上部のデモバナーで **あかり / ゆうと** を切り替えながら、

1. あかりで登録 → オンボーディング → 招待コードを作成
2. ゆうとに切り替え → コードで参加（ペアリング完了）
3. 今日の質問に回答 → 相手に切り替えて回答 → **同時公開** → AIメッセージ
4. Journey・Weekly Check-in・整える（Repair）・二人の約束・ふたりページ

という一連の体験を、状態遷移込みで確認できます。
デモの世界は `POST /api/demo/reset` でいつでも初期化できます。

### AI障害時の動作を見る

回答に `[[force-ai-error]]` を含めると、モックAIが意図的に失敗します。
回答の同時公開はそのまま行われ、定型の会話ガイドと再生成ボタンが表示されます（仕様 §30）。

---

## 🧱 技術スタック

- **Next.js 16 (App Router) / React 19 / TypeScript strict**
- **Tailwind CSS 4**（CSSカスタムプロパティによるデザイントークン、ダークモード対応）
- **shadcn/uiスタイルのUI層**（Radix UI primitives）
- **Zod 4**（フォーム & AI構造化出力の検証）
- **Vercel AI SDK**によるプロバイダー抽象化（mock / OpenAI / Anthropic をenvで切替、リトライ+フォールバック）
- **Supabase**（PostgreSQL / Auth / RLS / Storage / Realtime — migrations同梱）
- **Vitest + React Testing Library / Playwright + axe-core**

## 📂 構成

```
src/
  app/            ルート（(public) / (app) / (admin) グループ）
  components/     ui（プリミティブ）/ layout / shared
  features/       機能別コンポーネント（daily-questions, pairing, repair, ...）
  content/        Seed質問127問・Journey 5本・安全リソース・会話ガイド
  lib/            ai / analytics / auth / i18n / security / supabase / validation
  server/
    actions/      'use server' — 入力検証と薄いオーケストレーション
    services/     ドメインロジック（状態遷移・安全ゲート・dedupe）
    policies/     公開ルール・可視性・カップルメンバーシップ（純関数）
    repositories/ インターフェース + demo（インメモリ）/ supabase 両ドライバ
  tests/          unit / e2e
supabase/
  migrations/     スキーマ・security definer関数・RLS・Storage/Realtimeポリシー
  seed.sql        src/content から自動生成（scripts/generate-seed.mjs）
```

### プライバシーを支える3層

1. **Policies**（`src/server/policies/`）— 9状態の回答状態機械・5段階可視性の純関数
2. **Repositories** — 公開前のパートナー回答は**ドライバ内で結果から除外**（demo / supabase 共通）
3. **RLS**（`supabase/migrations/0004_rls.sql`）— `answers` は security definer 関数
   `submit_answer_and_maybe_reveal()` が単一トランザクションで公開するまで相手から SELECT 不能

`ai_generation_logs` はメタデータのみ（回答原文を保存しない）。分析イベントにPIIは含まれません。

---

## 🗄 Supabase を使う（本番モード）

1. Supabaseプロジェクトを作成し、SQL Editor または CLI でマイグレーションを順に適用:

   ```bash
   supabase db push        # または 0001〜0005 を順に実行
   psql < supabase/seed.sql
   ```

2. `.env.local` を設定:

   ```env
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # サーバー専用。クライアントへは絶対に出ない
   INVITATION_TOKEN_PEPPER=<openssl rand -base64 32>
   ```

3. AIを有効化する場合:

   ```env
   AI_MOCK_MODE=false
   AI_PROVIDER=anthropic            # または openai
   AI_MODEL=claude-sonnet-4-5
   AI_FALLBACK_PROVIDER=mock        # 障害時は定型ガイドへ
   ANTHROPIC_API_KEY=...
   ```

型生成（任意）: `supabase gen types typescript --project-id <id> > src/types/database.ts`

## ☁️ デプロイ（Vercel）

1. リポジトリをVercelへインポート
2. 上記の環境変数を設定（`SUPABASE_SERVICE_ROLE_KEY` はServer環境変数として）
3. `pnpm build` がそのままビルドコマンドです

---

## ✅ 品質ゲート

```bash
pnpm typecheck   # TypeScript strict
pnpm lint        # ESLint（レポジトリ層の直importも禁止）
pnpm test        # Vitest: 96 tests（状態機械・安全チェッカー・可視性・§37統合フロー）
pnpm build       # Next.js production build
pnpm test:e2e    # Playwright: §37シナリオ + axeアクセシビリティ（モバイル/デスクトップ）
```

E2Eは仕様 §37 のシナリオをそのまま検証します:
ペアリング（第三者の遮断・総当たりロック含む）/ 今日の質問（提出前の秘匿・同時公開・AI障害時の公開継続・エクスポート漏えい検査）/ Repair（原文非公開・高リスク停止・通知抑止）/ ペア解除 / PWA / WCAG。

## 🔒 セキュリティ設計の要点

- 招待トークン・6桁コードは**ペッパー付きHMAC-SHA256**のみ保存（生値はDBに存在しない）
- 招待の総当たりは5回でロック（demo/SQL両実装）
- Service Role Keyはサーバー専用モジュール（`server-only`）のみが参照
- Service Workerは**アプリシェルのみ**キャッシュ（回答本文・AI分析・Repairは network-only）
- 安全チェックはAI入出力の**前後両方**で実行（15カテゴリ、プロンプトインジェクション対策込み）

## 📋 完成条件チェックリスト（仕様 §38）

- [x] 新規ユーザー登録 / パートナー招待 / ペアリング
- [x] 今日の質問への回答・両者回答までの秘匿・同時公開
- [x] 構造化AI Insight（Zod検証・再生成・バージョン管理・dedupe）
- [x] AI障害時にも回答は閲覧可能（定型ガイド+再試行）
- [x] Journey進行（結婚前30問含む5本）/ Weekly Check-in / Repair Mode
- [x] 二人の約束（改訂履歴つき）/ ふたりページ / 取扱説明書
- [x] プライバシー設定 / ペア解除 / エクスポート / 削除申請
- [x] PWA（manifest / SW / オフライン画面 / インストール可能）
- [x] RLS（全テーブル + definer関数 + Storage/Realtimeポリシー）
- [x] TypeScript / Lint / Build / Unit / E2E すべてグリーン
- [x] `.env.example` / Migration / Seed / README

## 📄 ライセンスと注意

このアプリのAIは医師・心理療法士・弁護士ではありません。緊急時は 110 / 119、
DV相談は #8008（DV相談ナビ）へ。アプリ内 `/safety` にも常設しています。
