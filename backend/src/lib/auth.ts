import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'data.db';
const sqlite = new Database(dbPath);

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
                    ? '.gae-jp.net'
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
