import type { APIRoute } from 'astro';
import { db } from '../../lib/db/index.js';
import { profiles } from '../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
    if (!locals.session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const data = await request.json();

        await db
            .update(profiles)
            .set({
                name: data.name,
                roles: data.roles,
                experienceYears: parseInt(data.experienceYears),
                projectCount: parseInt(data.projectCount),
            })
            .where(eq(profiles.id, 1));

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to update profile' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};
