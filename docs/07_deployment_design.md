# デプロイメント設計書

## 1. デプロイメントオプション

### 1.1 オプション比較

| オプション       | 複雑度 | コスト | スケーラビリティ | 推奨環境     |
| ---------------- | ------ | ------ | ---------------- | ------------ |
| **モノリス**     | 低     | 低     | 中               | 個人・小規模 |
| **分離デプロイ** | 中     | 中〜高 | 高               | 成長期・商用 |
| **Docker**       | 中     | 低〜中 | 高               | 柔軟な運用   |

---

## 2. オプション1: モノリス構成（推奨）

### 2.1 アーキテクチャ

```
┌─────────────────────────────────┐
│      www-gae-jp (単一プロセス)    │
│                                 │
│  ┌──────────────────────────┐   │
│  │   Hono (バックエンド)      │   │
│  │   - API エンドポイント      │   │
│  │   - 静的ファイル配信        │   │
│  └──────────────────────────┘   │
│              ↓                  │
│  ┌──────────────────────────┐   │
│  │ Astro ビルド成果物 (静的)  │   │
│  │   - HTML/CSS/JS           │   │
│  └──────────────────────────┘   │
│              ↓                  │
│  ┌──────────────────────────┐   │
│  │   SQLite (data.db)        │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### 2.2 実装手順

#### ステップ1: Astro ビルド

```bash
cd frontend
pnpm build
# → frontend/dist/ に静的ファイル生成
```

#### ステップ2: Hono で静的ファイル配信

**`backend/src/index.ts`**:

```typescript
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

// API ルート（既存）
app.route('/api/auth', authRoutes);
// ... 省略

// 静的ファイル配信（Astro ビルド成果物）
app.use('/*', serveStatic({ root: '../frontend/dist' }));

// フォールバック（SPA用）
app.get('*', serveStatic({ path: '../frontend/dist/index.html' }));

export default app;
```

#### ステップ3: パッケージング

```bash
# ルートディレクトリで
pnpm build:all

# スクリプト例 (package.json)
{
  "scripts": {
    "build:frontend": "cd frontend && pnpm build",
    "build:backend": "cd backend && pnpm build",
    "build:all": "pnpm build:frontend && pnpm build:backend"
  }
}
```

#### ステップ4: デプロイ

```bash
# VPS にデプロイ
rsync -avz --exclude 'node_modules' ./ user@server:/var/www/www-gae-jp/

# サーバー上で
cd /var/www/www-gae-jp/backend
pnpm install --prod
NODE_ENV=production pnpm start
```

### 2.3 systemd サービス設定

**`/etc/systemd/system/www-gae-jp.service`**:

```ini
[Unit]
Description=www-gae-jp Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/www-gae-jp/backend
Environment="NODE_ENV=production"
Environment="PORT=4000"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**起動**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable www-gae-jp
sudo systemctl start www-gae-jp
```

---

## 3. オプション2: 分離デプロイ

### 3.1 アーキテクチャ

```
┌──────────────────────────────────┐
│       Nginx (リバースプロキシ)     │
│  www.gae-jp.net                  │
└──────────────────────────────────┘
           ↓              ↓
   ┌───────────────┐  ┌───────────────┐
   │   Frontend    │  │   Backend     │
   │   (Astro)     │  │   (Hono)      │
   │  localhost:3000│  │  localhost:4000│
   └───────────────┘  └───────────────┘
```

### 3.2 Nginx 設定

**`/etc/nginx/sites-available/www-gae-jp`**:

```nginx
upstream frontend {
    server localhost:3000;
}

upstream backend {
    server localhost:4000;
}

server {
    listen 80;
    server_name www.gae-jp.net;

    # API リクエスト → Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Cookie を転送
        proxy_set_header Cookie $http_cookie;
        proxy_pass_header Set-Cookie;
    }

    # その他のリクエスト → Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**有効化**:

```bash
sudo ln -s /etc/nginx/sites-available/www-gae-jp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.3 systemd サービス（2つ）

**Frontend (`/etc/systemd/system/www-gae-jp-frontend.service`)**:

```ini
[Unit]
Description=www-gae-jp Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/www-gae-jp/frontend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/server/entry.mjs
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Backend (`/etc/systemd/system/www-gae-jp-backend.service`)**:

```ini
[Unit]
Description=www-gae-jp Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/www-gae-jp/backend
Environment="NODE_ENV=production"
Environment="PORT=4000"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## 4. オプション3: Docker コンテナ

### 4.1 Dockerfile（Backend）

**`backend/Dockerfile`**:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### 4.2 Dockerfile（Frontend）

**`frontend/Dockerfile`**:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server/entry.mjs"]
```

### 4.3 Docker Compose

**`docker-compose.yml`**:

```yaml
version: '3.8'

services:
    backend:
        build:
            context: ./backend
            dockerfile: Dockerfile
        container_name: www-gae-jp-backend
        restart: unless-stopped
        ports:
            - '4000:4000'
        volumes:
            - ./data.db:/app/data.db
        environment:
            - NODE_ENV=production
            - PORT=4000
        networks:
            - app-network

    frontend:
        build:
            context: ./frontend
            dockerfile: Dockerfile
        container_name: www-gae-jp-frontend
        restart: unless-stopped
        ports:
            - '3000:3000'
        environment:
            - NODE_ENV=production
            - PUBLIC_API_URL=http://backend:4000/api
        depends_on:
            - backend
        networks:
            - app-network

    nginx:
        image: nginx:alpine
        container_name: www-gae-jp-nginx
        restart: unless-stopped
        ports:
            - '80:80'
            - '443:443'
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf:ro
            - ./ssl:/etc/nginx/ssl:ro
        depends_on:
            - frontend
            - backend
        networks:
            - app-network

networks:
    app-network:
        driver: bridge
```

**起動**:

```bash
docker-compose up -d
```

---

## 5. HTTPS設定（Let's Encrypt）

### 5.1 Certbot インストール

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 5.2 証明書取得

```bash
sudo certbot --nginx -d www.gae-jp.net
```

### 5.3 自動更新設定

```bash
sudo crontab -e
# 毎月1日 3:00 に更新チェック
0 3 1 * * certbot renew --quiet && systemctl reload nginx
```

---

## 6. 環境変数管理

### 6.1 `.env` ファイル（本番環境）

**Backend**:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=/var/www/www-gae-jp/data.db
FRONTEND_URL=https://www.gae-jp.net
```

**Frontend**:

```env
NODE_ENV=production
PUBLIC_API_URL=https://www.gae-jp.net/api
```

### 6.2 シークレット管理

- **推奨**: AWS Secrets Manager / HashiCorp Vault
- **シンプル**: `.env` ファイル（パーミッション 600）

```bash
chmod 600 .env
```

---

## 7. CI/CD パイプライン（GitHub Actions例）

### 7.1 `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
    push:
        branches:
            - main

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '20'

            - name: Install pnpm
              run: npm install -g pnpm

            - name: Build Frontend
              run: |
                  cd frontend
                  pnpm install --frozen-lockfile
                  pnpm build

            - name: Build Backend
              run: |
                  cd backend
                  pnpm install --frozen-lockfile
                  pnpm build

            - name: Deploy to VPS
              uses: appleboy/scp-action@master
              with:
                  host: ${{ secrets.VPS_HOST }}
                  username: ${{ secrets.VPS_USER }}
                  key: ${{ secrets.VPS_SSH_KEY }}
                  source: '.'
                  target: '/var/www/www-gae-jp'

            - name: Restart Services
              uses: appleboy/ssh-action@master
              with:
                  host: ${{ secrets.VPS_HOST }}
                  username: ${{ secrets.VPS_USER }}
                  key: ${{ secrets.VPS_SSH_KEY }}
                  script: |
                      cd /var/www/www-gae-jp/backend
                      pnpm install --prod
                      sudo systemctl restart www-gae-jp
```

---

## 8. バックアップ戦略

### 8.1 SQLite データベースバックアップ

**Cron ジョブ (毎日 2:00)**:

```bash
0 2 * * * cp /var/www/www-gae-jp/data.db /var/backups/www-gae-jp/data.db.$(date +\%Y\%m\%d)
```

### 8.2 世代管理（7日間保持）

```bash
find /var/backups/www-gae-jp -name "data.db.*" -mtime +7 -delete
```

---

## 9. モニタリング・ロギング

### 9.1 PM2（プロセス管理）

```bash
npm install -g pm2

# Backend起動
cd backend
pm2 start dist/index.js --name www-gae-jp-backend

# 自動起動設定
pm2 startup
pm2 save
```

### 9.2 ログ管理

```bash
# PM2 ログ
pm2 logs www-gae-jp-backend

# systemd ログ
sudo journalctl -u www-gae-jp -f
```

---

## 10. デプロイチェックリスト

### 準備

- [ ] VPS または ホスティング環境確保
- [ ] ドメイン取得・DNS設定
- [ ] SSL証明書取得（Let's Encrypt）

### ビルド

- [ ] Frontend ビルド成功
- [ ] Backend ビルド成功
- [ ] データベースマイグレーション実行

### 環境設定

- [ ] `.env` ファイル設定（本番環境）
- [ ] 環境変数の検証
- [ ] シークレット情報の保護

### デプロイ

[ ] ファイル転送（rsync / SCP）

- [ ] 依存関係インストール (`pnpm install --prod`)
- [ ] サービス起動（systemd / PM2 / Docker）
- [ ] Nginx 設定・リロード

### 検証

- [ ] ヘルスチェック (`/health`)
- [ ] トップページ表示確認
- [ ] API エンドポイント動作確認
- [ ] 管理画面ログイン確認
- [ ] HTTPS 接続確認

### 運用

- [ ] バックアップ設定
- [ ] モニタリング設定
- [ ] ログローテーション設定
- [ ] 自動更新設定（SSL証明書）
