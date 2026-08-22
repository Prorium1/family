<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# ブランド トーン＆マナー — 必読・厳守

**UIに関わる作業（色・ボタン・レイアウト・コピー）を行う前に、必ず
[`docs/BRAND.md`](docs/BRAND.md) を読んでから着手すること。**

このプロダクトの色は、ブランドロゴの実測ピクセルから導出されています。
好みで色を選ぶことは許されません。

## 絶対に外してはいけない3点

1. **ロゴが色の唯一の出典**
   - 左の円と頭 `#36A7F4` hsl(204°) = YOU（一人目）
   - 重なり（レンズ） `#AC75E6` hsl(269°) = **WE＝二人が生むもの**
   - 右の円と頭 `#F74699` hsl(332°) = ME（二人目）

   269°は204°と332°の中点（正確には268.1°）。「二人が中央で出会い、
   第三の答えが生まれる」というブランドの中心思想が、そのまま色相の幾何に
   なっている。全UIをこの線上に置く。マークの幾何は黄金比で、
   `src/config/mark-geometry.json` が唯一の出典（コンポーネントもアイコン生成も
   このファイルから描く）。

2. **色は装飾ではなく「誰のものか」を示す情報**
   - 自分のもの → `person-a`（青系）
   - 相手のもの → `person-b`（ピンク系）
   - **二人で作ったもの** → `primary` / ブレンド（紫）
   - 個人の色を共有物に使う／共有色を個人の入力に使うのは**禁止**。
     色が嘘をつくと、このプロダクトの中核である「同時公開」の信頼が壊れる。

3. **生の色を書かない**
   - コンポーネントに `#xxxxxx` を直書きしない
   - Tailwindの既定パレット（`bg-blue-500` 等）を使わない
   - 必ず `src/app/globals.css` のトークン経由（`bg-primary` `text-person-a` 等）

## 強制のしくみ

`src/tests/unit/brand.test.ts` がルールブックを機械検証します。
トークンの値、色相の並び、ライト／ダーク両方のWCAG AAコントラスト、
グラデーションの定義、角丸の範囲、生の色の直書き、
`docs/BRAND.md` の存在までを検査し、違反するとテストが落ちます。

色やトーンを変えるときは、必ずこの順序で:

1. `docs/BRAND.md` を更新
2. `src/tests/unit/brand.test.ts` の期待値を更新
3. `src/app/globals.css` を更新
4. `pnpm test` と `pnpm test:e2e`（axeのWCAG検査を含む）を通す

CSSだけ先に書き換えることは禁止。

## 言葉のトーン

罪悪感・脅し（「連続記録が途切れます」）、点数化（「相性◯点」）、
断定（「別れるべき」）は禁止。詳細は `docs/BRAND.md` §6。
