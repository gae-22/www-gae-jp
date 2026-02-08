import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { lucia } from '../lib/auth.js';

export const requireAuth = createMiddleware(async (c, next) => {
    const sessionId = getCookie(c, 'auth_session');

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
