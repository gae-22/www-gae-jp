const API_BASE_URL =
    (import.meta.env.PUBLIC_API_URL || 'http://localhost:4000') + '/api';

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
