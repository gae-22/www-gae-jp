# バックエンド（Hono）仕様書

## 1. プロジェクト構造

### ディレクトリ構成

```
backend/
├── src/
│   ├── index.ts              # アプリケーションエントリーポイント
│   ├── routes/               # APIルート定義
│   │   ├── auth.ts           # 認証API (/api/auth/*)
│   │   ├── profile.ts        # プロフィールAPI (/api/profile)
│   │   ├── skills.ts         # スキルAPI (/api/skills/*)
│   │   ├── timeline.ts       # タイムラインAPI (/api/timeline/*)
│   │   └── gear.ts           # ギアAPI (/api/gear/*)
│   ├── middleware/           # ミドルウェア
│   │   ├── auth.ts           # セッション検証ミドルウェア
│   │   ├── cors.ts           # CORS設定
│   │   └── logger.ts         # ログミドルウェア
│   ├── lib/                  # ライブラリ・ユーティリティ
│   │   ├── auth.ts           # Lucia Auth インスタンス
│   │   └── db/               # データベース
│   │       ├── index.ts      # Drizzle クライアント
│   │       └── schema.ts     # テーブルスキーマ
│   ├── types/                # 型定義
│   │   ├── api.ts            # APIリクエスト/レスポンス型
│   │   └── env.d.ts          # 環境変数型定義
│   └── scripts/              # ユーティリティスクリプト
│       └── seed.ts           # DB初期化スクリプト
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env.example
```

---

## 2. Hono アプリケーション初期化

### 2.1 エントリーポイント (`src/index.ts`)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import skillsRoutes from './routes/skills';
import timelineRoutes from './routes/timeline';
import gearRoutes from './routes/gear';

const app = new Hono();

// グローバルミドルウェア
app.use('*', logger());
app.use(
    '/api/*',
    cors({
        origin:
            process.env.NODE_ENV === 'production'
                ? 'https://www.gae-jp.net'
                : 'http://localhost:3000',
        credentials: true,
    }),
);

// ルート登録
app.route('/api/auth', authRoutes);
app.route('/api', profileRoutes);
app.route('/api/skills', skillsRoutes);
app.route('/api/timeline', timelineRoutes);
app.route('/api/gear', gearRoutes);

// ヘルスチェック
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;

// サーバー起動（開発環境）
if (process.env.NODE_ENV !== 'production') {
    const port = parseInt(process.env.PORT || '4000');
    console.log(`🚀 Server running on http://localhost:${port}`);

    // Node.jsアダプター使用
    import('serve').then(({ serve }) => {
        serve({
            fetch: app.fetch,
            port,
        });
    });
}
```

---

## 3. ルーティング設計

### 3.1 認証ルート (`routes/auth.ts`)

```typescript
import { Hono } from 'hono';
import { lucia } from '../lib/auth';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';

const auth = new Hono();

// POST /api/auth/login
auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();

    if (!username || !password) {
        return c.json({ error: 'Invalid credentials' }, 400);
    }

    // ユーザー検索
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    // パスワード検証
    const validPassword = await verify(user.hashedPassword, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
    });

    if (!validPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    // セッション作成
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Cookie設定
    c.header('Set-Cookie', sessionCookie.serialize());

    return c.json({ success: true });
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
    const sessionId = c.req.cookie('auth_session');

    if (!sessionId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // セッション無効化
    await lucia.invalidateSession(sessionId);

    // Cookie削除
    const blankCookie = lucia.createBlankSessionCookie();
    c.header('Set-Cookie', blankCookie.serialize());

    // リダイレクト
    return c.redirect('/admin/login', 302);
});

export default auth;
```

### 3.2 プロフィールルート (`routes/profile.ts`)

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { db } from '../lib/db';
import { profiles } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const profile = new Hono();

// POST /api/profile
profile.post('/profile', requireAuth, async (c) => {
    const data = await c.req.json();

    try {
        await db
            .update(profiles)
            .set({
                name: data.name,
                roles: data.roles,
                experienceYears: parseInt(data.experienceYears),
                projectCount: parseInt(data.projectCount),
            })
            .where(eq(profiles.id, 1));

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to update profile' }, 500);
    }
});

export default profile;
```

### 3.3 スキルルート (`routes/skills.ts`)

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { db } from '../lib/db';
import { skills } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const skillsRouter = new Hono();

// POST /api/skills
skillsRouter.post('/', requireAuth, async (c) => {
    const data = await c.req.json();

    try {
        const allSkills = await db.select().from(skills);
        const maxOrder =
            allSkills.length > 0
                ? Math.max(...allSkills.map((s) => s.order))
                : -1;

        await db.insert(skills).values({
            name: data.name,
            category: data.category,
            order: maxOrder + 1,
        });

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to create skill' }, 500);
    }
});

// DELETE /api/skills/:id
skillsRouter.delete('/:id', requireAuth, async (c) => {
    const id = parseInt(c.req.param('id'));

    try {
        await db.delete(skills).where(eq(skills.id, id));
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete skill' }, 500);
    }
});

export default skillsRouter;
```

### 3.4 タイムライン・ギアルート

同様のパターンで実装（省略）。詳細は `03_api_specification.md` を参照。

---

## 4. ミドルウェア設計

### 4.1 セッション検証ミドルウェア (`middleware/auth.ts`)

```typescript
import { createMiddleware } from 'hono/factory';
import { lucia } from '../lib/auth';

export const requireAuth = createMiddleware(async (c, next) => {
    const sessionId = c.req.cookie('auth_session');

    if (!sessionId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const { session, user } = await lucia.validateSession(sessionId);

    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // セッション更新（fresh の場合）
    if (session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        c.header('Set-Cookie', sessionCookie.serialize());
    }

    // コンテキストに保存
    c.set('session', session);
    c.set('user', user);

    await next();
});
```

### 4.2 CORS ミドルウェア

Hono 標準の `hono/cors` を使用:

```typescript
import { cors } from 'hono/cors';

app.use(
    '/api/*',
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowHeaders: ['Content-Type'],
    }),
);
```

### 4.3 ロガーミドルウェア

```typescript
import { logger } from 'hono/logger';

app.use('*', logger());
```

---

## 5. 環境変数管理

### `.env.example`

```env
# Node環境
NODE_ENV=development

# サーバー設定
PORT=4000
FRONTEND_URL=http://localhost:3000

# データベース
DATABASE_URL=../data.db

# セッション設定（オプション）
SESSION_MAX_AGE=2592000
```

### 環境変数型定義 (`types/env.d.ts`)

```typescript
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            PORT?: string;
            FRONTEND_URL?: string;
            DATABASE_URL?: string;
        }
    }
}

export {};
```

---

## 6. エラーハンドリング戦略

### 6.1 グローバルエラーハンドラー

```typescript
app.onError((err, c) => {
    console.error(`[ERROR] ${err.message}`, err);

    return c.json(
        {
            error:
                process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error'
                    : err.message,
        },
        500,
    );
});
```

### 6.2 統一エラーレスポンス

```typescript
// utils/errors.ts
export function errorResponse(message: string, status = 500) {
    return { error: message, status };
}
```

---

## 7. テスト戦略

### 7.1 テストフレームワーク

- **Vitest**: 高速 TypeScript テストランナー
- **Supertest 相当**: Hono の `app.request()` でテスト

### 7.2 テスト例

```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
        const res = await app.request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'wrong', password: 'wrong' }),
        });

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('Invalid credentials');
    });
});
```

---

## 8. ビルド・デプロイ設定

### 8.1 `package.json`

```json
{
    "name": "backend",
    "type": "module",
    "scripts": {
        "dev": "tsx watch src/index.ts",
        "build": "tsc",
        "start": "node dist/index.js",
        "db:generate": "drizzle-kit generate",
        "db:push": "drizzle-kit push",
        "test": "vitest"
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
        "vitest": "^1.0.0",
        "@types/better-sqlite3": "^7.6.12"
    }
}
```

### 8.2 `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

---

## 9. 開発ワークフロー

### 9.1 開発環境起動

```bash
cd backend
pnpm install
pnpm db:push        # DBマイグレーション
pnpm dev            # ホットリロード開発サーバー (localhost:4000)
```

### 9.2 本番ビルド

```bash
pnpm build          # TypeScript → JavaScript
pnpm start          # 本番サーバー起動
```

---

## 10. 実装チェックリスト

- [ ] プロジェクト構造作成
- [ ] Hono アプリケーション初期化
- [ ] CORS ミドルウェア設定
- [ ] ロガーミドルウェア設定
- [ ] セッション検証ミドルウェア実装
- [ ] データベースクライアント設定
- [ ] Lucia Auth 初期化
- [ ] 認証ルート実装
- [ ] プロフィールルート実装
- [ ] スキルルート実装
- [ ] タイムラインルート実装
- [ ] ギアルート実装
- [ ] エラーハンドラー実装
- [ ] 環境変数設定
- [ ] テスト実装
- [ ] ビルド設定
