import { db } from '@kairox/db';
import * as schema from '@kairox/db/schema/index';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema,
	}),
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 2 * 60, // 2 Minutes
		},
	},
	trustedOrigins: ['http://localhost:3001', 'http://172.20.10.3:3001'],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: process.env.NODE_ENV === 'production',
		password: {
			hash: (password) => Bun.password.hash(password),
			verify: (data) => Bun.password.verify(data.password, data.hash),
		},
	},
	advanced: {
		database: {
			generateId: () => Bun.randomUUIDv7(),
		},
		defaultCookieAttributes: {
			sameSite: 'none',
			secure: true,
			httpOnly: true,
		},
	},
});
