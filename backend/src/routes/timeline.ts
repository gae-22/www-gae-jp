import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../lib/db/index.js';
import { timeline } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';

const timelineRouter = new Hono();

// GET /api/timeline
timelineRouter.get('/', async (c) => {
    try {
        const timelineData = await db
            .select()
            .from(timeline)
            .orderBy(timeline.order);
        return c.json(timelineData);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to fetch timeline' }, 500);
    }
});

// POST /api/timeline
timelineRouter.post('/', requireAuth, async (c) => {
    const data = await c.req.json<{
        startDate: string;
        endDate?: string;
        title: string;
        organization?: string;
        description: string;
    }>();

    try {
        const allTimeline = await db.select().from(timeline);
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

        return c.json({ success: true });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to create timeline' }, 500);
    }
});

// PUT /api/timeline/:id
timelineRouter.put('/:id', requireAuth, async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json<{
        startDate: string;
        endDate?: string | null;
        title: string;
        organization?: string | null;
        description: string;
    }>();

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

        return c.json({ success: true });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to update timeline' }, 500);
    }
});

// DELETE /api/timeline/:id
timelineRouter.delete('/:id', requireAuth, async (c) => {
    const id = parseInt(c.req.param('id'));

    try {
        await db.delete(timeline).where(eq(timeline.id, id));
        return c.json({ success: true });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to delete timeline' }, 500);
    }
});

export default timelineRouter;
