import { Hono } from 'hono';
import { lucia } from '../lib/auth.js';
import { db } from '../lib/db/index.js';
import { users } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';

const auth = new Hono()
    .post('/login', async (c) => {
        const body = await c.req.json<{ username: string; password: string }>();
        const { username, password } = body;

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
    })
    .post('/logout', async (c) => {
        const sessionId = c.req
            .header('cookie')
            ?.match(/auth_session=([^;]+)/)?.[1];

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
