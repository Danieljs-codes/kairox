import type { LoggerContext } from '@orpc/experimental-pino';
import type { Context as HonoContext } from 'hono';
import { Kysely } from 'kysely';
import type { Database } from '@kairox/db';
import { auth } from '@kairox/auth';
import type { PaystackClient } from './lib/paystack';
import type { S3Client } from 'bun';

export type CreateContextOptions = {
	context: HonoContext;
};

type StaticContext = {
	db: Kysely<Database>;
	paystack: PaystackClient;
	s3: S3Client;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>> & StaticContext & LoggerContext;
