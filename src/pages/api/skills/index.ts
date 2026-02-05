import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { skills } from '../../../lib/db/schema';

export const POST: APIRoute = async ({ request, locals }) => {
    if (!locals.session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const data = await request.json();

        // Get max order
        const allSkills = await db.select().from(skills).all();
        const maxOrder =
            allSkills.length > 0
                ? Math.max(...allSkills.map((s) => s.order))
                : -1;

        await db.insert(skills).values({
            name: data.name,
            category: data.category,
            order: maxOrder + 1,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to create skill' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};
