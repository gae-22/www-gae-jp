# アーキテクチャ全体設計書

## 1. プロジェクト概要

### 現在の構成

- **フレームワーク**: Astro (SSR モード)
- **Node.js アダプター**: `@astrojs/node` (standalone モード)
- **スタイリング**: TailwindCSS v4 + フォント (Inter, Outfit, JetBrains Mono, Zen Kaku Gothic New)
- **データベース**: SQLite + Drizzle ORM
- **認証**: Lucia Auth v3
- **MDX サポート**: rehype-pretty-code + Shiki (シンタックスハイライト)
- **パッケージマネージャー**: pnpm

### 移行後の構成（目標）

```
┌─────────────────────────────────────────────────────────┐
│                     クライアント                           │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│              フロントエンド (Astro)                        │
│  - SSG/SSR ハイブリッド                                   │
│  - ページレンダリング                                      │
│  - MDX コンテンツ管理                                     │
│  - アセット最適化                                         │
└─────────────────────────────────────────────────────────┘
                         ↓ REST API
┌─────────────────────────────────────────────────────────┐
│              バックエンド (Hono)                          │
│  - API エンドポイント                                     │
│  - 認証・セッション管理                                    │
│  - ビジネスロジック                                        │
│  - データベース操作                                        │
└─────────────────────────────────────────────────────────┘
                         ↓ SQL
┌─────────────────────────────────────────────────────────┐
│              データベース (SQLite)                         │
│  - Drizzle ORM                                          │
│  - テーブル: users, sessions, profiles, skills,         │
│             timeline, gear                              │
└─────────────────────────────────────────────────────────┘
```

## 2. アーキテクチャ設計方針

### 2.1 フロントエンド・バックエンド分離の理由

#### メリット

1. **関心の分離**: UI とビジネスロジックを明確に分離
2. **スケーラビリティ**: 将来的にマイクロサービス化が容易
3. **開発効率**: フロントとバックを並行開発可能
4. **デプロイの柔軟性**: 各層を独立してデプロイ・スケール可能
5. **型安全性**: TypeScript で統一し、型共有が可能

#### デメリット（対策含む）

1. **開発の複雑性増加** → モノレポ構成で管理
2. **ネットワークレイテンシ** → 同一サーバーでの運用も可能
3. **認証の複雑化** → Cookie ベース認証で共通ドメイン運用

### 2.2 プロジェクト構造

```
www-gae-jp/
├── frontend/           # Astro フロントエンド
│   ├── src/
│   │   ├── components/ # UI コンポーネント
│   │   ├── layouts/    # レイアウトコンポーネント
│   │   ├── pages/      # ページルーティング
│   │   ├── content/    # MDX コンテンツ (blog, projects, about)
│   │   └── styles/     # グローバルスタイル
│   └── package.json
│
├── backend/            # Hono バックエンド (新規作成)
│   ├── src/
│   │   ├── routes/     # API ルート定義
│   │   ├── middleware/ # 認証・CORS ミドルウェア
│   │   ├── lib/        # DB・認証ライブラリ
│   │   ├── types/      # 型定義
│   │   └── index.ts    # エントリーポイント
│   └── package.json
│
├── shared/             # 共有型定義・ユーティリティ (新規作成)
│   ├── types/
│   └── package.json
│
├── drizzle/            # DB マイグレーション
├── pnpm-workspace.yaml # モノレポ設定
└── package.json        # ルート設定
```

### 2.3 技術スタック詳細

#### フロントエンド

- **Astro 5.x**: 静的サイト生成 + SSR ハイブリッド
- **TailwindCSS 4.x**: ユーティリティファーストCSS
- **MDX**: ブログ・プロジェクト記事
- **Lucide Icons**: SVG アイコン

#### バックエンド

- **Hono**: 超軽量 Web フレームワーク
- **Lucia Auth v3**: セッション管理
- **Drizzle ORM**: 型安全な SQL クエリビルダー
- **Better-SQLite3**: 高速 SQLite ドライバー
- **@node-rs/argon2**: パスワードハッシュ化

#### 共通

- **TypeScript**: 完全な型安全性
- **pnpm Workspaces**: モノレポ管理

## 3. API 通信設計

### 3.1 通信方式

- **プロトコル**: REST API over HTTP/HTTPS
- **データフォーマット**: JSON
- **認証**: Cookie ベース (Lucia セッション)

### 3.2 エンドポイント設計

```
Backend (Hono): http://localhost:4000/api/*
Frontend (Astro): http://localhost:3000/*
```

本番環境では、リバースプロキシ (Nginx/Caddy) またはサーバーレス環境で統一ドメイン運用:

```
https://www.gae-jp.net/         → Astro (Frontend)
https://www.gae-jp.net/api/*    → Hono (Backend)
```

### 3.3 CORS 設定

開発環境:

- Backend は `http://localhost:3000` からのリクエストを許可
- Credentials 有効化 (Cookie 送信)

本番環境:

- 同一ドメイン運用のため CORS 不要

## 4. デプロイメント戦略

### 4.1 開発環境

```bash
# Backend
cd backend && pnpm dev  # http://localhost:4000

# Frontend
cd frontend && pnpm dev # http://localhost:3000
```

### 4.2 本番環境オプション

#### オプション1: モノリス（推奨：シンプルな構成）

- Hono で静的ファイルサーバー機能を追加
- Astro ビルド成果物を Hono で配信
- 単一プロセスで運用

#### オプション2: 分離デプロイ

- Frontend: Vercel / Netlify / Cloudflare Pages
- Backend: VPS / Cloudflare Workers / Vercel Functions
- リバースプロキシで統一ドメイン化

#### オプション3: コンテナ化

- Docker Compose で Frontend + Backend
- Nginx リバースプロキシ

## 5. セキュリティ設計

### 5.1 認証フロー

1. ユーザーがログインフォーム送信 → Backend `/api/auth/login`
2. Backend がパスワード検証 → Lucia でセッション作成
3. Set-Cookie でセッション ID を返却
4. Frontend は Cookie を自動送信
5. Backend ミドルウェアでセッション検証

### 5.2 CSRF 対策

- Astro の `security.checkOrigin` を有効化
- SameSite Cookie 属性設定

### 5.3 環境変数管理

```env
# Backend (.env)
DATABASE_URL=./data.db
NODE_ENV=production
SESSION_SECRET=xxx

# Frontend (.env)
PUBLIC_API_URL=http://localhost:4000
ADMIN_USERNAME=xxx
ADMIN_PASSWORD=xxx
```

## 6. 移行ステップ概要

1. **Phase 1**: Backend (Hono) セットアップ
2. **Phase 2**: API エンドポイント移行
3. **Phase 3**: Frontend 接続調整
4. **Phase 4**: テスト・検証
5. **Phase 5**: デプロイメント設定

詳細は `implementation_plan.md` を参照。
