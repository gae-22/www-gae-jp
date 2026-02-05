import { db } from '../src/lib/db/index';
import { profiles, timeline, gear, skills, users } from '../src/lib/db/schema';
import fs from 'fs';
import yaml from 'yaml';
import { hash } from '@node-rs/argon2';
import { generateIdFromEntropySize } from 'lucia';

// Read .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^(\w+)=["']?(.+?)["']?$/);
        if (match) {
            envVars[match[1]] = match[2];
        }
    }
});

const adminUsername = envVars.ADMIN_USERNAME;
const adminPassword = envVars.ADMIN_PASSWORD;

// Read YAML data
const profileYaml = fs.readFileSync('src/content/about/profile.yaml', 'utf-8');
const profileData = yaml.parse(profileYaml);

async function migrate() {
    console.log('Starting data migration...');
    console.log(`Admin username: ${adminUsername}`);

    // Migrate profile
    await db.insert(profiles).values({
        id: 1,
        name: profileData.name,
        roles: profileData.roles,
        experienceYears: profileData.stats.experience,
        projectCount: profileData.stats.projects,
    });
    console.log('✓ Profile migrated');

    // Migrate timeline
    for (let i = 0; i < profileData.timeline.length; i++) {
        const item = profileData.timeline[i];
        await db.insert(timeline).values({
            startDate: item.year,
            endDate: null,
            title: item.title,
            organization: item.company || null,
            description: item.description,
            order: i,
        });
    }
    console.log(`✓ ${profileData.timeline.length} timeline items migrated`);

    // Migrate gear
    for (let i = 0; i < profileData.gear.length; i++) {
        await db.insert(gear).values({
            name: profileData.gear[i],
            order: i,
        });
    }
    console.log(`✓ ${profileData.gear.length} gear items migrated`);

    // Migrate skills
    let order = 0;
    for (const lang of profileData.skills.languages) {
        await db.insert(skills).values({
            category: 'languages',
            name: lang,
            order: order++,
        });
    }
    for (const fw of profileData.skills.frameworks) {
        await db.insert(skills).values({
            category: 'frameworks',
            name: fw,
            order: order++,
        });
    }
    for (const other of profileData.skills.others) {
        await db.insert(skills).values({
            category: 'others',
            name: other,
            order: order++,
        });
    }
    console.log('✓ Skills migrated');

    // Create admin user from .env
    const userId = generateIdFromEntropySize(10);
    const hashedPassword = await hash(adminPassword, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
    });

    await db.insert(users).values({
        id: userId,
        username: adminUsername,
        hashedPassword: hashedPassword,
    });
    console.log(`✓ Admin user created (username: ${adminUsername})`);

    console.log('\n✅ Migration completed successfully!');
    console.log('ℹ️  Login credentials are stored in .env file');
}

migrate().catch(console.error);
