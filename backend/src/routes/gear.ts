import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../lib/db/index.js';
import { gear } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';

const gearRouter = new Hono()
    .get('/', async (c) => {
        try {
            const gearData = await db.select().from(gear).orderBy(gear.order);
            return c.json(gearData);
        } catch (error) {
            console.error(error);
            return c.json({ error: 'Failed to fetch gear' }, 500);
        }
    })
    .post('/', requireAuth, async (c) => {
        const data = await c.req.json<{ name: string }>();

        try {
            const allGear = await db.select().from(gear);
            const maxOrder =
                allGear.length > 0
                    ? Math.max(...allGear.map((g) => g.order))
                    : -1;

            await db.insert(gear).values({
                name: data.name,
                order: maxOrder + 1,
            });

            return c.json({ success: true });
        } catch (error) {
            console.error(error);
            return c.json({ error: 'Failed to create gear' }, 500);
        }
    })
    .delete('/:id', requireAuth, async (c) => {
        const id = parseInt(c.req.param('id'));

        try {
            await db.delete(gear).where(eq(gear.id, id));
            return c.json({ success: true });
        } catch (error) {
            console.error(error);
            return c.json({ error: 'Failed to delete gear' }, 500);
        }
    });

export default gearRouter;
