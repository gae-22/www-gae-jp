# フロントエンド（Astro）仕様書

## 1. プロジェクト構造

### ディレクトリ構成

```
frontend/  (移行後の新しい配置)
├── src/
│   ├── components/           # UIコンポーネント
│   │   ├── core/            # 共通コアコンポーネント
│   │   ├── features/        # 機能別コンポーネント
│   │   │   ├── about/       # Aboutページ専用
│   │   │   ├── blog/        # ブログ機能
│   │   │   └── home/        # トップページ専用
│   │   ├── icons/           # アイコンコンポーネント
│   │   └── layout/          # レイアウトコンポーネント
│   ├── layouts/             # ページレイアウト
│   │   ├── BaseLayout.astro     # 基本レイアウト
│   │   └── PostLayout.astro     # ブログ記事レイアウト
│   ├── pages/               # ページルーティング
│   │   ├── index.astro          # トップページ
│   │   ├── about.astro          # Aboutページ
│   │   ├── projects.astro       # プロジェクト一覧
│   │   ├── 404.astro            # カスタム404
│   │   ├── blog/
│   │   │   ├── index.astro      # ブログ一覧
│   │   │   └── [...slug].astro  # ブログ記事詳細
│   │   └── admin/
│   │       ├── login.astro      # ログイン
│   │       └── dashboard.astro  # 管理画面
│   ├── content/             # Content Collections
│   │   ├── config.ts            # コレクション定義
│   │   ├── blog/                # ブログ記事 (MDX)
│   │   ├── projects/            # プロジェクト (MDX)
│   │   └── about/               # Aboutページコンテンツ
│   ├── styles/
│   │   └── global.css           # グローバルスタイル + TailwindCSS
│   ├── lib/                 # ユーティリティ
│   │   └── api.ts               # API通信クライアント
│   └── env.d.ts             # 環境変数型定義
├── public/                  # 静的アセット
│   ├── noise.png
│   ├── github-bg.png
│   └── ...
├── astro.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 2. ページ構成

### 2.1 パブリックページ（SSG）

| ページ       | パス           | レンダリング | 説明                                     |
| ------------ | -------------- | ------------ | ---------------------------------------- |
| トップ       | `/`            | SSG          | ポートフォリオトップ（Hero, Bento Grid） |
| About        | `/about`       | SSG          | 自己紹介・経歴・スキル                   |
| プロジェクト | `/projects`    | SSG          | プロジェクト一覧                         |
| ブログ一覧   | `/blog`        | SSG          | ブログ記事一覧                           |
| ブログ記事   | `/blog/[slug]` | SSG          | ブログ記事詳細（MDX）                    |
| 404          | `/404`         | SSG          | カスタム404ページ                        |

### 2.2 管理画面（SSR）

| ページ         | パス               | レンダリング | 認証 | 説明           |
| -------------- | ------------------ | ------------ | ---- | -------------- |
| ログイン       | `/admin/login`     | SSR          | ❌   | 管理者ログイン |
| ダッシュボード | `/admin/dashboard` | SSR          | ✅   | CMS管理画面    |

---

## 3. API通信設計

### 3.1 APIクライアント (`lib/api.ts`)

```typescript
const API_BASE_URL =
    import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    credentials?: RequestCredentials;
}

async function apiRequest<T = any>(
    endpoint: string,
    options: ApiOptions = {},
): Promise<T> {
    const { method = 'GET', body, credentials = 'include' } = options;

    const config: RequestInit = {
        method,
        credentials,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

// エクスポート関数
export const api = {
    auth: {
        login: (username: string, password: string) =>
            apiRequest('/auth/login', {
                method: 'POST',
                body: { username, password },
            }),
        logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    },
    profile: {
        update: (data: ProfileData) =>
            apiRequest('/profile', { method: 'POST', body: data }),
    },
    skills: {
        create: (data: SkillData) =>
            apiRequest('/skills', { method: 'POST', body: data }),
        delete: (id: number) =>
            apiRequest(`/skills/${id}`, { method: 'DELETE' }),
    },
    timeline: {
        create: (data: TimelineData) =>
            apiRequest('/timeline', { method: 'POST', body: data }),
        update: (id: number, data: TimelineData) =>
            apiRequest(`/timeline/${id}`, { method: 'PUT', body: data }),
        delete: (id: number) =>
            apiRequest(`/timeline/${id}`, { method: 'DELETE' }),
    },
    gear: {
        create: (data: GearData) =>
            apiRequest('/gear', { method: 'POST', body: data }),
        delete: (id: number) => apiRequest(`/gear/${id}`, { method: 'DELETE' }),
    },
};
```

### 3.2 管理画面でのAPI使用例

```astro
---
// pages/admin/dashboard.astro
import { api } from '../../lib/api';

if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();
  const action = formData.get('action');

  if (action === 'update_profile') {
    await api.profile.update({
      name: formData.get('name'),
      roles: JSON.parse(formData.get('roles')),
      experienceYears: formData.get('experienceYears'),
      projectCount: formData.get('projectCount'),
    });
  }
}
---
```

---

## 4. SSG / SSR ハイブリッド戦略

### 4.1 レンダリング設定

**`astro.config.mjs`**:

```javascript
export default defineConfig({
    output: 'hybrid', // SSG + SSR ハイブリッド
    adapter: node({ mode: 'standalone' }),
});
```

### 4.2 SSR ページ指定

```astro
---
// pages/admin/dashboard.astro
export const prerender = false; // SSR強制
---
```

### 4.3 SSG ページ（デフォルト）

```astro
---
// pages/index.astro
// prerender: true (デフォルト)
---
```

---

## 5. Content Collections 設計

### 5.1 コレクション定義 (`content/config.ts`)

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.date(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().default(false),
    }),
});

const projects = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        github: z.string().url().optional(),
        demo: z.string().url().optional(),
        order: z.number(),
    }),
});

export const collections = { blog, projects };
```

### 5.2 コンテンツ取得例

```astro
---
import { getCollection } from 'astro:content';

const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
const projects = await getCollection('projects');
---
```

---

## 6. コンポーネント設計

### 6.1 レイアウトコンポーネント

#### `BaseLayout.astro`

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  {description && <meta name="description" content={description}>}
  <link rel="sitemap" href="/sitemap-index.xml">
</head>
<body>
  <slot />
</body>
</html>
```

### 6.2 機能コンポーネント

既存のコンポーネントをそのまま移行:

- `features/home/*`: Bento Grid, Hero, Navigation
- `features/blog/*`: PostCard, TableOfContents
- `features/about/*`: Skills, Timeline, Gear

---

## 7. スタイリング

### 7.1 TailwindCSS 設定

**`tailwind.config.js`**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Zen Kaku Gothic New', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
};
```

### 7.2 グローバルスタイル (`styles/global.css`)

既存のスタイルを移行（TailwindCSS + カスタムCSS）。

---

## 8. 環境変数管理

### 8.1 環境変数定義

**`.env`**:

```env
# バックエンドAPI URL
PUBLIC_API_URL=http://localhost:4000/api

# 管理者認証情報（初期化用）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
```

### 8.2 型定義 (`env.d.ts`)

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_API_URL: string;
    readonly ADMIN_USERNAME: string;
    readonly ADMIN_PASSWORD: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

---

## 9. MDX設定

### 9.1 Astro Config

```javascript
import mdx from '@astrojs/mdx';
import rehypePrettyCode from 'rehype-pretty-code';

export default defineConfig({
    integrations: [
        mdx({
            syntaxHighlight: false,
            rehypePlugins: [
                [
                    rehypePrettyCode,
                    {
                        theme: 'tokyo-night',
                        keepBackground: false,
                    },
                ],
            ],
        }),
    ],
});
```

---

## 10. ビルド・デプロイ設定

### 10.1 `package.json`

```json
{
    "name": "frontend",
    "type": "module",
    "scripts": {
        "dev": "astro dev --host",
        "build": "astro build",
        "preview": "astro preview --host"
    },
    "dependencies": {
        "astro": "^5.17.1",
        "@astrojs/node": "^9.0.0",
        "@astrojs/mdx": "^4.3.13",
        "@astrojs/sitemap": "^3.7.0",
        "tailwindcss": "^4.1.18",
        "@tailwindcss/vite": "^4.1.18",
        "@tailwindcss/typography": "^0.5.19"
    }
}
```

### 10.2 ビルド出力

```bash
pnpm build
# → dist/ ディレクトリに静的ファイル + SSR サーバーコード
```

---

## 11. 移行チェックリスト

### プロジェクト構造

- [ ] `frontend/` ディレクトリ作成
- [ ] 既存ファイルを新しい構造に移動

### ページ・コンポーネント

- [ ] 全ページを `frontend/src/pages/` に移動
- [ ] 全コンポーネントを `frontend/src/components/` に移動
- [ ] レイアウトファイル移動

### API通信

- [ ] `lib/api.ts` 作成
- [ ] 管理画面でのAPI呼び出しを新しいクライアントに変更
- [ ] 環境変数 `PUBLIC_API_URL` 設定

### Content Collections

- [ ] `content/` ディレクトリ移動
- [ ] `content/config.ts` 確認

### スタイリング

- [ ] `styles/global.css` 移動
- [ ] TailwindCSS 設定確認

### ビルド設定

- [ ] `astro.config.mjs` 更新（output: 'hybrid'）
- [ ] `package.json` 確認
- [ ] `.env` 作成

### 動作確認

- [ ] トップページ表示確認
- [ ] Aboutページ表示確認
- [ ] ブログ一覧・詳細表示確認
- [ ] 管理画面ログイン確認
- [ ] API通信確認
