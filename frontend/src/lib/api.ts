import { hc } from 'hono/client';
import type { AppType } from '@backend/index';

const getApiBaseUrl = () => {
    if (typeof process !== 'undefined' && process.env?.PUBLIC_API_URL) {
        return process.env.PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window as any)._PUBLIC_API_URL) {
        return (window as any)._PUBLIC_API_URL;
    }
    return import.meta.env.PUBLIC_API_URL || 'http://localhost:4000';
};

const client = hc<AppType>(getApiBaseUrl());

// 型定義
interface ProfileData {
    name: string;
    roles: string[];
    experienceYears: string;
    projectCount: string;
}

interface SkillData {
    name: string;
    category: 'languages' | 'frameworks' | 'others';
}

interface TimelineData {
    startDate: string;
    endDate?: string;
    title: string;
    organization?: string;
    description: string;
}

interface GearData {
    name: string;
    // order is handled by backend
}

// エクスポート関数
export const api = {
    auth: {
        login: async (username: string, password: string) => {
            const res = await client.api.auth.login.$post({
                json: { username, password },
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Login failed');
            }
            return res.json();
        },
        logout: async () => {
            const res = await client.api.auth.logout.$post();
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Logout failed');
            }
            return res.json();
        },
    },
    profile: {
        update: async (data: ProfileData) => {
            const res = await client.api.profile.$post({
                json: data,
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Update failed');
            }
            return res.json();
        },
    },
    skills: {
        create: async (data: SkillData) => {
            const res = await client.api.skills.$post({
                json: data,
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Create failed');
            }
            return res.json();
        },
        delete: async (id: number) => {
            const res = await client.api.skills[':id'].$delete({
                param: { id: id.toString() },
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Delete failed');
            }
            return res.json();
        },
    },
    timeline: {
        create: async (data: TimelineData) => {
            const res = await client.api.timeline.$post({
                json: data,
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Create failed');
            }
            return res.json();
        },
        update: async (id: number, data: TimelineData) => {
            const res = await client.api.timeline[':id'].$put({
                param: { id: id.toString() },
                json: data,
            } as any);
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Update failed');
            }
            return res.json();
        },
        delete: async (id: number) => {
            const res = await client.api.timeline[':id'].$delete({
                param: { id: id.toString() },
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Delete failed');
            }
            return res.json();
        },
    },
    gear: {
        create: async (data: GearData) => {
            const res = await client.api.gear.$post({
                json: data,
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Create failed');
            }
            return res.json();
        },
        delete: async (id: number) => {
            const res = await client.api.gear[':id'].$delete({
                param: { id: id.toString() },
            });
            if (!res.ok) {
                const errorData = (await res.json()) as { error?: string };
                throw new Error(errorData.error || 'Delete failed');
            }
            return res.json();
        },
    },
};
