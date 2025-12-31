import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
import type { DB } from './generated/types';

types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool,
	}),
	plugins: [new CamelCasePlugin()],
});

export type Database = DB;
export type { DB };
