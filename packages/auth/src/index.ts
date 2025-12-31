import { pool } from '@kairox/db';
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
	database: pool,
	user: {
		fields: {
			emailVerified: 'email_verified',
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 2 * 60, // 2 Minutes
		},
		fields: {
			userId: 'user_id',
			expiresAt: 'expires_at',
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			ipAddress: 'ip_address',
			userAgent: 'user_agent',
		},
	},
	account: {
		fields: {
			userId: 'user_id',
			accountId: 'account_id',
			providerId: 'provider_id',
			accessToken: 'access_token',
			refreshToken: 'refresh_token',
			idToken: 'id_token',
			accessTokenExpiresAt: 'access_token_expires_at',
			refreshTokenExpiresAt: 'refresh_token_expires_at',
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
	},
	verification: {
		fields: {
			expiresAt: 'expires_at',
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
	},
	experimental: {
		joins: true,
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
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
			secure: process.env.NODE_ENV === 'production',
			httpOnly: process.env.NODE_ENV === 'production',
		},
	},
});
