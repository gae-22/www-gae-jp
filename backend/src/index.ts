import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

const app = new Hono();

// グローバルミドルウェア
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
    '/api/*',
    cors({
        origin: (origin, c) => {
            if (process.env.NODE_ENV === 'production') {
                const allowedOrigins = [
                    'https://www.gae-jp.net',
                    process.env.FRONTEND_URL,
                ].filter(Boolean);

                if (allowedOrigins.includes(origin)) {
                    return origin;
                }
                return 'https://www.gae-jp.net';
            }
            const requestOrigin = c.req.header('origin');
            if (
                requestOrigin === 'http://localhost:4321' ||
                requestOrigin === 'http://localhost:3000'
            ) {
                return requestOrigin;
            }
            return 'http://localhost:4321';
        },
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowHeaders: ['Content-Type', 'Cookie'],
    }),
);

// ルート登録
app.get('/api/ping', (c) => c.json({ message: 'pong' }));

// ヘルスチェック
app.get('/health', (c) => c.json({ status: 'ok' }));

// エラーハンドラー
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

export default app;

// サーバー起動（Node.js環境）
if (
    process.env.NODE_ENV !== 'production' ||
    process.argv[1]?.includes('index')
) {
    const port = parseInt(process.env.PORT || '4000');
    console.log(`🚀 Server running on http://localhost:${port}`);

    import('@hono/node-server').then(({ serve }) => {
        serve({
            fetch: app.fetch,
            port,
        });
    });
}
