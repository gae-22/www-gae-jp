# www-gae-jp

Astro で構築したポートフォリオサイト。

## 技術スタック

- [Astro](https://astro.build/) 5.x (SSG + Node.js アダプター)
- [TailwindCSS](https://tailwindcss.com/) 4.x
- [MDX](https://mdxjs.com/) (ブログ記事)
- [Shiki](https://shiki.matsu.io/) (シンタックスハイライト)
- [Lucide Icons](https://lucide.dev/) / Iconify

## セットアップ

```bash
# 前提条件: Node.js 20+, pnpm
pnpm install
```

## 開発

```bash
pnpm dev        # http://localhost:4321 で起動
```

## ビルド & プレビュー

```bash
pnpm build      # dist/ に出力
pnpm preview    # ビルド結果をプレビュー
pnpm start      # dist/ を Node.js で起動 (環境変数 .env を使用)
```

## プロジェクト構造

```plaintext
src/
├── components/
│   ├── features/   # ページ固有のコンポーネント
│   ├── layout/     # Header, Footer
│   └── ui/         # 汎用 UI コンポーネント
├── content/        # ブログ・プロジェクト・プロフィールデータ
├── layouts/        # ページレイアウト
├── pages/          # ルーティング
└── styles/         # グローバル CSS
public/             # 静的アセット (フォント, favicon 等)
```

## ライセンス

プライベートプロジェクト
