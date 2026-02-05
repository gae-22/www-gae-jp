import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { timeline } from '../../../lib/db/schema';

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
        const allTimeline = await db.select().from(timeline).all();
        const maxOrder =
            allTimeline.length > 0
                ? Math.max(...allTimeline.map((t) => t.order))
                : -1;

        await db.insert(timeline).values({
            startDate: data.startDate,
            endDate: data.endDate || null,
            title: data.title,
            organization: data.organization || null,
            description: data.description,
            order: maxOrder + 1,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to create timeline' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};
