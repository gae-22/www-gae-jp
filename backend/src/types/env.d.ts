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
