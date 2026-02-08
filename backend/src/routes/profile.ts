import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../lib/db/index.js';
import { profiles } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';

const profile = new Hono()
    .get('/profile', async (c) => {
        try {
            const profileData = await db.select().from(profiles).limit(1);
            if (profileData.length === 0) {
                return c.json({ error: 'Profile not found' }, 404);
            }
            return c.json(profileData[0]);
        } catch (error) {
            console.error(error);
            return c.json({ error: 'Failed to fetch profile' }, 500);
        }
    })
    .post('/profile', requireAuth, async (c) => {
        const data = await c.req.json<{
            name: string;
            roles: string[];
            experienceYears: string;
            projectCount: string;
        }>();

        try {
            await db
                .update(profiles)
                .set({
                    name: data.name,
                    roles: data.roles,
                    experienceYears: parseInt(data.experienceYears),
                    projectCount: parseInt(data.projectCount),
                })
                .where(eq(profiles.id, 1));

            return c.json({ success: true });
        } catch (error) {
            console.error(error);
            return c.json({ error: 'Failed to update profile' }, 500);
        }
    });

export default profile;
