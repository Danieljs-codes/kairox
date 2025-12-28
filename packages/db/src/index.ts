import { relations } from './schema';
import { remember } from '@epic-web/remember';
import { drizzle } from 'drizzle-orm/bun-sql';

// Lazy initialization to ensure env vars are loaded before db connection
function initializeDb() {
	return remember('db', () => {
		const dbUrl = process.env.DATABASE_URL || '';

		return drizzle(dbUrl, { relations, logger: true });
	});
}

// Direct export with lazy initialization on first access
export const db = initializeDb();

export type DB = typeof db;
