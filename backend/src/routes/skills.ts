import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../lib/db/index.js';
import { skills } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';

const skillsRouter = new Hono();

// GET /api/skills
skillsRouter.get('/', async (c) => {
    try {
        const skillsData = await db.select().from(skills).orderBy(skills.order);
        return c.json(skillsData);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to fetch skills' }, 500);
    }
});

// POST /api/skills
skillsRouter.post('/', requireAuth, async (c) => {
    const data = await c.req.json<{
        name: string;
        category: 'languages' | 'frameworks' | 'others';
    }>();

    try {
        const allSkills = await db.select().from(skills);
        const maxOrder =
            allSkills.length > 0
                ? Math.max(...allSkills.map((s) => s.order))
                : -1;

        await db.insert(skills).values({
            name: data.name,
            category: data.category,
            order: maxOrder + 1,
        });

        return c.json({ success: true });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to create skill' }, 500);
    }
});

// DELETE /api/skills/:id
skillsRouter.delete('/:id', requireAuth, async (c) => {
    const id = parseInt(c.req.param('id'));

    try {
        await db.delete(skills).where(eq(skills.id, id));
        return c.json({ success: true });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to delete skill' }, 500);
    }
});

export default skillsRouter;
