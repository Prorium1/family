# ブランド原本

デザイナーから受け取ったロゴの原本です。**編集しないでください。**

| ファイル | 内容 |
| --- | --- |
| `logo-master.svg` | マスターロゴ（背景なし） |
| `app-icon.svg` | アプリアイコン（白背景） |
| `golden-ratio-spec.txt` | 黄金比の導出仕様（デザイナー作成） |

アプリはこの原本を直接読み込みません。座標は
[`src/config/mark-geometry.json`](../../src/config/mark-geometry.json)、
色は [`src/app/globals.css`](../../src/app/globals.css) の
`--brand-*` トークンに写してあり、

- `src/components/shared/brand-mark.tsx`（画面のマーク）
- `scripts/generate-icons.mjs`（PWAアイコン生成）

の両方がその一つのファイルから描いています。実際に、コンポーネントの描画結果は
このマスターSVGと**1ピクセルの差もありません**（500×387で全画素一致を確認済み）。

原本を差し替えるときは、`docs/BRAND.md` §8 の順序に従ってください。
