# 認証・セキュリティ設計書

## 1. 認証システム概要

### 1.1 採用技術

- **認証ライブラリ**: Lucia Auth v3
- **セッション管理**: Cookie ベース（HttpOnly）
- **パスワードハッシュ**: Argon2 (`@node-rs/argon2`)
- **データベース**: SQLite (Better-SQLite3)
- **アダプター**: `@lucia-auth/adapter-sqlite`

### 1.2 アーキテクチャ

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant L as Lucia Auth
    participant DB as データベース

    Note over U,DB: ログインフロー
    U->>F: ユーザー名・パスワード入力
    F->>B: POST /api/auth/login
    B->>DB: SELECT * FROM users WHERE username=?
    DB-->>B: User record
    B->>B: Argon2でパスワード検証
    B->>L: createSession(userId)
    L->>DB: INSERT INTO sessions
    DB-->>L: Session created
    L-->>B: Session object
    B->>B: createSessionCookie(sessionId)
    B-->>F: Set-Cookie: auth_session=xxx
    F-->>U: ログイン成功

    Note over U,DB: 認証リクエスト
    U->>F: 管理画面操作
    F->>B: POST /api/profile (Cookie付き)
    B->>L: validateSession(sessionId)
    L->>DB: SELECT * FROM sessions WHERE id=?
    DB-->>L: Session record
    L->>L: 有効期限チェック
    L-->>B: Session valid
    B->>B: ビジネスロジック実行
    B-->>F: レスポンス返却

    Note over U,DB: ログアウトフロー
    U->>F: ログアウトボタンクリック
    F->>B: POST /api/auth/logout (Cookie付き)
    B->>L: invalidateSession(sessionId)
    L->>DB: DELETE FROM sessions WHERE id=?
    DB-->>L: Deleted
    L-->>B: Session invalidated
    B->>B: createBlankSessionCookie()
    B-->>F: Set-Cookie: auth_session=; Max-Age=0
    F-->>U: ログアウト成功
```

---

## 2. Lucia Auth 設定

### 2.1 初期化 (`backend/src/lib/auth.ts`)

```typescript
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import Database from 'better-sqlite3';

const sqlite = new Database('../data.db');

const adapter = new BetterSqlite3Adapter(sqlite, {
    user: 'users',
    session: 'sessions',
});

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        name: 'auth_session',
        expires: true,
        attributes: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain:
                process.env.NODE_ENV === 'production'
                    ? '.gae-jp.net' // サブドメイン共有
                    : undefined,
        },
    },
    getUserAttributes: (attributes) => ({
        username: attributes.username,
    }),
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: {
            username: string;
        };
    }
}
```

### 2.2 セッション有効期限

- **デフォルト**: 30日間 (2592000秒)
- **アイドルタイムアウト**: Lucia がセッション更新を自動管理
- **Fresh フラグ**: セッション有効期限の半分を過ぎると `session.fresh = true` になり、Cookie を再発行

---

## 3. パスワードセキュリティ

### 3.1 Argon2 設定

```typescript
import { hash, verify } from '@node-rs/argon2';

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
    return hash(password, {
        memoryCost: 19456, // 19MB メモリ使用
        timeCost: 2, // 2回反復
        outputLen: 32, // 32バイト出力
        parallelism: 1, // 並列度1
    });
}

// パスワード検証
export async function verifyPassword(
    hash: string,
    password: string,
): Promise<boolean> {
    return verify(hash, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
    });
}
```

### 3.2 パスワードポリシー（推奨）

- **最小長**: 8文字以上
- **複雑さ**: 英数字 + 記号を推奨
- **辞書アタック対策**: Argon2 の高コスト設定

---

## 4. Cookieセキュリティ

### 4.1 Cookie属性

| 属性       | 値                   | 説明                                   |
| ---------- | -------------------- | -------------------------------------- |
| `HttpOnly` | `true`               | JavaScript からアクセス不可（XSS対策） |
| `SameSite` | `Lax`                | CSRF攻撃軽減                           |
| `Secure`   | `true` (本番)        | HTTPS通信のみ（中間者攻撃対策）        |
| `Domain`   | `.gae-jp.net` (本番) | サブドメイン共有                       |
| `Path`     | `/`                  | 全パスで有効                           |
| `Max-Age`  | `2592000` (30日)     | Cookie有効期限                         |

### 4.2 本番環境 vs 開発環境

| 設定     | 開発環境    | 本番環境      |
| -------- | ----------- | ------------- |
| `Secure` | `false`     | `true`        |
| `Domain` | `undefined` | `.gae-jp.net` |
| Protocol | HTTP        | HTTPS         |

---

## 5. CSRF対策

### 5.1 Astro の Origin チェック

**`astro.config.mjs`**:

```javascript
export default defineConfig({
    security: {
        checkOrigin: process.env.NODE_ENV === 'production',
        allowedOrigins: ['https://www.gae-jp.net'],
    },
});
```

### 5.2 SameSite Cookie

- `SameSite=Lax`: クロスサイトからの POST リクエストで Cookie を送信しない
- ログインフォームなど、トップレベルナビゲーションでは送信

---

## 6. CORS設定

### 6.1 開発環境

**バックエンド (Hono)**:

```typescript
import { cors } from 'hono/cors';

app.use(
    '/api/*',
    cors({
        origin: 'http://localhost:3000',
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);
```

### 6.2 本番環境

同一ドメイン運用のため CORS 不要:

```
https://www.gae-jp.net/         → Astro (Frontend)
https://www.gae-jp.net/api/*    → Hono (Backend)
```

リバースプロキシ (Nginx) で統一:

```nginx
location /api/ {
  proxy_pass http://backend:4000/api/;
}

location / {
  proxy_pass http://frontend:3000/;
}
```

---

## 7. セッションライフサイクル

### 7.1 セッション作成

```typescript
// ログイン成功時
const session = await lucia.createSession(user.id, {});
const sessionCookie = lucia.createSessionCookie(session.id);
c.header('Set-Cookie', sessionCookie.serialize());
```

### 7.2 セッション検証

```typescript
// ミドルウェアで検証
const sessionId = c.req.cookie('auth_session');
const { session, user } = await lucia.validateSession(sessionId);

if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
}

// Fresh セッションの場合、Cookie を再発行
if (session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    c.header('Set-Cookie', sessionCookie.serialize());
}
```

### 7.3 セッション無効化

```typescript
// ログアウト時
await lucia.invalidateSession(sessionId);
const blankCookie = lucia.createBlankSessionCookie();
c.header('Set-Cookie', blankCookie.serialize());
```

---

## 8. 脆弱性対策

### 8.1 XSS（クロスサイトスクリプティング）

- **HttpOnly Cookie**: JavaScript からセッション Cookie にアクセス不可
- **Content Security Policy (CSP)**: 推奨（フロントエンド実装）
- **出力エスケープ**: Astro が自動でエスケープ

### 8.2 CSRF（クロスサイトリクエストフォージェリ）

- **SameSite=Lax Cookie**: クロスサイトからの POST をブロック
- **Origin チェック**: Astro の `security.checkOrigin`

### 8.3 SQL Injection

- **Drizzle ORM**: プリペアドステートメントで自動防御
- **パラメータ化クエリ**: ユーザー入力を直接SQL文字列に埋め込まない

### 8.4 Brute Force Attack

- **推奨対策**:
    - レート制限 (Hono ミドルウェア)
    - アカウントロック機構
    - 多要素認証 (2FA) の導入検討

### 8.5 Session Fixation

- **対策**: Lucia がセッション ID をランダム生成

---

## 9. セキュリティヘッダー（推奨）

### 9.1 Helmet 相当のヘッダー設定

```typescript
// Hono グローバルミドルウェア
app.use('*', async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
    );
    await next();
});
```

### 9.2 Content Security Policy (CSP)

```typescript
c.header(
    'Content-Security-Policy',
    "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:;",
);
```

---

## 10. 環境別セキュリティ設定

### 10.1 開発環境

```env
NODE_ENV=development
SECURE_COOKIES=false
ALLOWED_ORIGINS=http://localhost:3000
```

### 10.2 本番環境

```env
NODE_ENV=production
SECURE_COOKIES=true
ALLOWED_ORIGINS=https://www.gae-jp.net
```

---

## 11. セキュリティチェックリスト

### 認証・セッション

- [ ] Lucia Auth 正しく初期化
- [ ] HttpOnly Cookie 設定
- [ ] SameSite=Lax 設定
- [ ] Secure Cookie (本番環境)
- [ ] セッション有効期限設定
- [ ] セッション検証ミドルウェア実装

### パスワード

- [ ] Argon2 でハッシュ化
- [ ] 適切なコスト設定 (memoryCost, timeCost)
- [ ] パスワードポリシー実装（推奨）

### CSRF対策

- [ ] Astro Origin チェック有効化
- [ ] SameSite Cookie 設定

### CORS

- [ ] 開発環境: CORS 設定
- [ ] 本番環境: 同一ドメイン運用または Nginx 設定

### 脆弱性対策

- [ ] XSS対策（HttpOnly Cookie, CSP）
- [ ] SQL Injection 対策（ORM使用）
- [ ] セキュリティヘッダー設定
- [ ] レート制限（推奨）

### 環境管理

- [ ] 環境変数で本番/開発を切り替え
- [ ] シークレット情報を `.env` に隔離
- [ ] `.env` を `.gitignore` に追加
