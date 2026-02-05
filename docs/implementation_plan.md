# 実装計画書

> [!IMPORTANT]
> この実装計画は、既存のAstroプロジェクトをフロントエンド（Astro）とバックエンド（Hono）に分離する大規模なリファクタリングです。既存の機能を維持しながら、将来的なスケーラビリティと保守性を向上させることを目的としています。

---

## 1. プロジェクト概要

### 目的

- **関心の分離**: UI とビジネスロジックを明確に分離
- **スケーラビリティ**: 将来的にマイクロサービス化が容易
- **保守性向上**: フロントとバックを独立して開発・デプロイ可能

### 現在の構成

```
www-gae-jp/
├── src/
│   ├── pages/api/        # Astro APIルート（削除予定）
│   ├── middleware.ts     # Astro ミドルウェア（移行予定）
│   └── lib/              # 共有ライブラリ（分離予定）
└── ...
```

### 移行後の構成

```
www-gae-jp/
├── frontend/             # Astro フロントエンド
├── backend/              # Hono バックエンド
├── shared/               # 共有型定義
└── ...
```

---

## 2. 実装フェーズ

### フェーズ1: プロジェクトセットアップ

**期間**: 1日
**目標**: モノレポ構成とバックエンドプロジェクトの初期化

### フェーズ2: バックエンド実装

**期間**: 2-3日
**目標**: Hono で全APIエンドポイントを実装

### フェーズ3: フロントエンド移行

**期間**: 1-2日
**目標**: Astro プロジェクトの再構成とAPI接続

### フェーズ4: 統合テスト・検証

**期間**: 1日
**目標**: 動作確認とバグ修正

### フェーズ5: デプロイメント

**期間**: 1日
**目標**: 本番環境へのデプロイ設定

---

## 3. 詳細実装計画

### フェーズ1: プロジェクトセットアップ

#### タスクリスト

- [ ] `pnpm-workspace.yaml` 作成（モノレポ設定）
- [ ] `backend/` ディレクトリ作成
- [ ] `backend/package.json` 作成
- [ ] `backend/tsconfig.json` 作成
- [ ] バックエンド依存関係インストール
- [ ] `shared/` ディレクトリ作成（共有型定義用）
- [ ] `frontend/` ディレクトリ作成
- [ ] 既存 `src/` を `frontend/src/` に移動

#### 作成ファイル

**`pnpm-workspace.yaml`**:

```yaml
packages:
    - 'frontend'
    - 'backend'
    - 'shared'
```

**`backend/package.json`**:

```json
{
    "name": "backend",
    "type": "module",
    "scripts": {
        "dev": "tsx watch src/index.ts",
        "build": "tsc",
        "start": "node dist/index.js"
    },
    "dependencies": {
        "hono": "^4.0.0",
        "@hono/node-server": "^1.0.0",
        "lucia": "^3.2.0",
        "@lucia-auth/adapter-sqlite": "^3.0.2",
        "drizzle-orm": "^0.36.0",
        "better-sqlite3": "^11.0.0",
        "@node-rs/argon2": "^2.0.2"
    },
    "devDependencies": {
        "typescript": "^5.3.0",
        "tsx": "^4.0.0",
        "@types/better-sqlite3": "^7.6.12"
    }
}
```

**ディレクトリ構造作成**:

```bash
mkdir -p backend/src/{routes,middleware,lib/{db},types,scripts}
mkdir -p shared/types
mkdir -p frontend
```

---

### フェーズ2: バックエンド実装

#### タスクリスト

##### データベース・認証セットアップ

- [ ] `backend/src/lib/db/schema.ts` 作成（既存からコピー）
- [ ] `backend/src/lib/db/index.ts` 作成（Drizzleクライアント）
- [ ] `backend/src/lib/auth.ts` 作成（Lucia Auth）
- [ ] `backend/drizzle.config.ts` 作成

##### ミドルウェア実装

- [ ] `backend/src/middleware/auth.ts` 作成（セッション検証）
- [ ] `backend/src/middleware/cors.ts` 作成（開発環境用CORS）
- [ ] `backend/src/middleware/logger.ts` 作成（ログミドルウェア）

##### APIルート実装

- [ ] `backend/src/routes/auth.ts` 作成
    - POST `/api/auth/login`
    - POST `/api/auth/logout`
- [ ] `backend/src/routes/profile.ts` 作成
    - POST `/api/profile`
- [ ] `backend/src/routes/skills.ts` 作成
    - POST `/api/skills`
    - DELETE `/api/skills/:id`
- [ ] `backend/src/routes/timeline.ts` 作成
    - POST `/api/timeline`
    - PUT `/api/timeline/:id`
    - DELETE `/api/timeline/:id`
- [ ] `backend/src/routes/gear.ts` 作成
    - POST `/api/gear`
    - DELETE `/api/gear/:id`

##### アプリケーション初期化

- [ ] `backend/src/index.ts` 作成（Honoアプリ初期化）
- [ ] エラーハンドラー実装
- [ ] ヘルスチェックエンドポイント `/health`
- [ ] `.env.example` 作成

##### ユーティリティ

- [ ] `backend/src/scripts/seed.ts` 作成（DB初期化スクリプト）
- [ ] `shared/types/api.ts` 作成（共有型定義）

#### 実装ファイル一覧

| ファイルパス                     | 説明                         |
| -------------------------------- | ---------------------------- |
| `backend/src/index.ts`           | Honoアプリエントリーポイント |
| `backend/src/routes/auth.ts`     | 認証API                      |
| `backend/src/routes/profile.ts`  | プロフィールAPI              |
| `backend/src/routes/skills.ts`   | スキルAPI                    |
| `backend/src/routes/timeline.ts` | タイムラインAPI              |
| `backend/src/routes/gear.ts`     | ギアAPI                      |
| `backend/src/middleware/auth.ts` | セッション検証ミドルウェア   |
| `backend/src/lib/auth.ts`        | Lucia Auth初期化             |
| `backend/src/lib/db/schema.ts`   | Drizzle スキーマ             |
| `backend/src/lib/db/index.ts`    | Drizzle クライアント         |
| `backend/src/types/env.d.ts`     | 環境変数型定義               |
| `shared/types/api.ts`            | API型定義（フロントと共有）  |

---

### フェーズ3: フロントエンド移行

#### タスクリスト

##### プロジェクト再構成

- [ ] 既存 `src/` を `frontend/src/` に移動
- [ ] `frontend/package.json` 作成・更新
- [ ] `frontend/astro.config.mjs` 更新
- [ ] `frontend/tsconfig.json` 確認

##### API通信クライアント作成

- [ ] `frontend/src/lib/api.ts` 作成（API通信ユーティリティ）
- [ ] 環境変数 `PUBLIC_API_URL` 設定
- [ ] `frontend/src/env.d.ts` 更新

##### 既存APIルート削除

- [ ] `frontend/src/pages/api/` ディレクトリ削除
- [ ] `frontend/src/middleware.ts` 削除（セッション管理はバックエンドへ）
- [ ] `frontend/src/lib/auth.ts` 削除
- [ ] `frontend/src/lib/db/` ディレクトリ削除

##### 管理画面の更新

- [ ] `frontend/src/pages/admin/login.astro` 更新
    - 新しいAPIクライアント使用
- [ ] `frontend/src/pages/admin/dashboard.astro` 更新
    - API通信を新しいクライアントに変更

##### 環境設定

- [ ] `frontend/.env.example` 作成
- [ ] `frontend/.env` 作成（開発環境用）

---

### フェーズ4: 統合テスト・検証

#### テスト計画

##### 1. バックエンドAPI単体テスト

**テスト内容**:

- 各APIエンドポイントの動作確認
- 認証フローの検証
- エラーハンドリングの確認

**実行方法**:

```bash
cd backend

# ログインテスト
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# プロフィール更新テスト（認証必要）
curl -X POST http://localhost:4000/api/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test","roles":["Developer"],"experienceYears":"5","projectCount":"10"}'

# ログアウトテスト
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt
```

##### 2. フロントエンド・バックエンド統合テスト

**テスト内容**:

- トップページ表示確認
- Aboutページ表示確認
- ブログ一覧・詳細表示確認
- 管理画面ログイン確認
- CMS機能（プロフィール更新、スキル追加・削除等）確認

**実行方法**:

```bash
# Terminal 1: バックエンド起動
cd backend
pnpm dev  # http://localhost:4000

# Terminal 2: フロントエンド起動
cd frontend
pnpm dev  # http://localhost:3000

# ブラウザで確認
# 1. http://localhost:3000/ にアクセス
# 2. http://localhost:3000/about にアクセス
# 3. http://localhost:3000/admin/login にアクセスしてログイン
# 4. 管理画面でプロフィール更新・スキル追加等を実行
```

##### 3. ビルドテスト

**実行方法**:

```bash
# ルートディレクトリで
pnpm install
pnpm build:frontend
pnpm build:backend

# ビルド成果物確認
ls -la frontend/dist
ls -la backend/dist
```

#### バグ修正・調整

- [ ] テスト結果からバグを特定
- [ ] API レスポンス形式の調整
- [ ] エラーメッセージの統一
- [ ] TypeScript 型エラーの修正

---

### フェーズ5: デプロイメント

#### デプロイオプション選択

- [ ] デプロイ方式を決定（モノリス / 分離 / Docker）
- [ ] 本番環境の環境変数設定
- [ ] データベースマイグレーション実行

#### デプロイ手順（例: モノリス構成）

**1. ビルド**:

```bash
pnpm build:all
```

**2. VPS へ転送**:

```bash
rsync -avz --exclude 'node_modules' ./ user@server:/var/www/www-gae-jp/
```

**3. サーバー上でセットアップ**:

```bash
ssh user@server
cd /var/www/www-gae-jp

# 依存関係インストール
cd backend && pnpm install --prod
cd ../frontend && pnpm install --prod

# DB初期化（初回のみ）
cd ../backend
pnpm tsx src/scripts/seed.ts

# サービス起動
sudo systemctl start www-gae-jp
```

**4. 動作確認**:

- [ ] ヘルスチェック: `https://www.gae-jp.net/health`
- [ ] トップページ表示確認
- [ ] 管理画面ログイン確認

---

## 4. ロールバック戦略

### バックアップ

移行前に以下をバックアップ:

- [ ] `data.db` (SQLiteデータベース)
- [ ] 既存コード全体（Gitタグ作成）

```bash
# Gitタグ作成
git tag -a pre-hono-migration -m "Before Hono migration"
git push origin pre-hono-migration

# データベースバックアップ
cp data.db data.db.backup-$(date +%Y%m%d)
```

### ロールバック手順

問題が発生した場合:

```bash
# 1. Gitで前のバージョンに戻す
git checkout pre-hono-migration

# 2. データベース復元
cp data.db.backup-YYYYMMDD data.db

# 3. 再ビルド・再起動
pnpm build
sudo systemctl restart www-gae-jp
```

---

## 5. リスク管理

### 主要リスク

| リスク                     | 影響         | 対策                              |
| -------------------------- | ------------ | --------------------------------- |
| **セッション管理の不整合** | ログイン不可 | 既存Lucia設定を慎重に移行、テスト |
| **CORS エラー**            | API通信失敗  | 開発環境で十分なテスト            |
| **データベース接続エラー** | 全機能停止   | パス設定の確認、バックアップ      |
| **型定義の不一致**         | ビルドエラー | 共有型定義を活用                  |
| **デプロイ失敗**           | サービス停止 | ロールバック手順の準備            |

---

## 6. 検証計画

### 機能検証チェックリスト

#### パブリックページ

- [ ] トップページ表示
- [ ] Aboutページ表示（スキル、タイムライン、ギア表示）
- [ ] プロジェクト一覧表示
- [ ] ブログ一覧表示
- [ ] ブログ記事詳細表示
- [ ] 404ページ表示

#### 管理機能

- [ ] ログイン成功
- [ ] ログイン失敗（誤ったパスワード）
- [ ] セッション維持（ページリロード後もログイン状態）
- [ ] ログアウト成功

#### CMS機能

- [ ] プロフィール更新
- [ ] スキル追加
- [ ] スキル削除
- [ ] タイムライン追加
- [ ] タイムライン更新
- [ ] タイムライン削除
- [ ] ギア追加
- [ ] ギア削除

#### セキュリティ

- [ ] 未認証時のAPI呼び出しが401エラー
- [ ] CSRF対策が有効（本番環境）
- [ ] HTTPS接続が有効（本番環境）
- [ ] Cookie が HttpOnly

---

## 7. 実装スケジュール（目安）

| フェーズ    | 期間      | 主要タスク               |
| ----------- | --------- | ------------------------ |
| **Phase 1** | 0.5日     | プロジェクトセットアップ |
| **Phase 2** | 2-3日     | バックエンド実装         |
| **Phase 3** | 1-2日     | フロントエンド移行       |
| **Phase 4** | 1日       | 統合テスト・検証         |
| **Phase 5** | 1日       | デプロイメント           |
| **合計**    | **5-7日** |                          |

---

## 8. 次のステップ

> [!IMPORTANT]
> この実装計画をレビューして承認後、フェーズ1から順次実装を開始します。

**承認後の流れ**:

1. Phase 1 セットアップ開始
2. Phase 2 バックエンド実装
3. Phase 3 フロントエンド移行
4. Phase 4 テスト・検証
5. Phase 5 デプロイ

**質問・確認事項**:

- デプロイ方式の選択（モノリス / 分離 / Docker）
- 本番環境の詳細（VPS / Vercel / Cloudflare等）
- スケジュール調整
