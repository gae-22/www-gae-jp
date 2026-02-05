import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { timeline } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params, locals }) => {
    if (!locals.session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const id = parseInt(params.id!);

    try {
        await db.delete(timeline).where(eq(timeline.id, id));

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to delete timeline' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
    if (!locals.session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const id = parseInt(params.id!);
    const data = await request.json();

    try {
        await db
            .update(timeline)
            .set({
                startDate: data.startDate,
                endDate: data.endDate || null,
                title: data.title,
                organization: data.organization || null,
                description: data.description,
            })
            .where(eq(timeline.id, id));

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to update timeline' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};
