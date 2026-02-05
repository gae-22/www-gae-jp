# www-gae-jp - Astro + Hono モノレポ

フロントエンド（Astro）とバックエンド（Hono）を分離したモノレポ構成のポートフォリオサイト。

## プロジェクト構造

```
www-gae-jp/
├── frontend/          # Astro フロントエンド
├── backend/           # Hono バックエンド API
├── shared/            # 共有型定義
├── docs/              # 設計書・仕様書
└── drizzle/           # データベースマイグレーション
```

## セットアップ

### 前提条件

- Node.js 20+
- pnpm

### インストール

```bash
pnpm install
```

### 開発環境の起動

#### 両方同時に起動（推奨）

```bash
pnpm dev
```

#### 個別に起動

```bash
# Backend (ポート 4000)
pnpm dev:backend

# Frontend (ポート 3000)
pnpm dev:frontend
```

## 環境変数

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=../data.db
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
PUBLIC_API_URL=http://localhost:4000/api
```

## ビルド

```bash
# 全体をビルド
pnpm build

# 個別にビルド
pnpm build:backend
pnpm build:frontend
```

## データベース

### マイグレーション実行

```bash
cd backend
pnpm db:push
```

### 初期データ投入

```bash
cd backend
pnpm tsx src/scripts/seed.ts
```

## API エンドポイント

| エンドポイント      | メソッド | 認証 | 説明             |
| ------------------- | -------- | ---- | ---------------- |
| `/api/auth/login`   | POST     | ❌   | ログイン         |
| `/api/auth/logout`  | POST     | ✅   | ログアウト       |
| `/api/profile`      | POST     | ✅   | プロフィール更新 |
| `/api/skills`       | POST     | ✅   | スキル作成       |
| `/api/skills/:id`   | DELETE   | ✅   | スキル削除       |
| `/api/timeline`     | POST     | ✅   | タイムライン作成 |
| `/api/timeline/:id` | PUT      | ✅   | タイムライン更新 |
| `/api/timeline/:id` | DELETE   | ✅   | タイムライン削除 |
| `/api/gear`         | POST     | ✅   | ギア作成         |
| `/api/gear/:id`     | DELETE   | ✅   | ギア削除         |

## 技術スタック

### Frontend

- Astro 5.x (SSG/SSR ハイブリッド)
- TailwindCSS 4.x
- MDX
- Lucide Icons

### Backend

- Hono (超軽量 Web フレームワーク)
- Lucia Auth v3 (認証)
- Drizzle ORM (SQLite)
- @node-rs/argon2 (パスワードハッシュ化)

## ドキュメント

詳細な設計書・仕様書は `docs/` ディレクトリを参照してください：

- [アーキテクチャ全体設計書](docs/01_architecture_overview.md)
- [データベース設計書](docs/02_database_design.md)
- [API仕様書](docs/03_api_specification.md)
- [バックエンド仕様書](docs/04_backend_specification.md)
- [フロントエンド仕様書](docs/05_frontend_specification.md)
- [認証・セキュリティ設計書](docs/06_auth_security_design.md)
- [デプロイメント設計書](docs/07_deployment_design.md)
- [実装計画書](docs/implementation_plan.md)

## ライセンス

プライベートプロジェクト
