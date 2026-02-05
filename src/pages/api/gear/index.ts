import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { gear } from '../../../lib/db/schema';

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
        const allGear = await db.select().from(gear).all();
        const maxOrder =
            allGear.length > 0 ? Math.max(...allGear.map((g) => g.order)) : -1;

        await db.insert(gear).values({
            name: data.name,
            order: maxOrder + 1,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to create gear' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};
