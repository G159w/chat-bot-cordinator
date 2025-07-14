import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import * as schema from '../db/schema';

// Test database setup
export const createTestDatabase = async () => {
	const pglite = new PGlite();
	const db = drizzle(pglite, { schema });

	// Run migrations
	await migrate(db, { migrationsFolder: './drizzle' });

	return { db, pglite };
};

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;
