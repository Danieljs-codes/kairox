import { createContext } from '@kairox/api/context';
import { appRouter } from '@kairox/api/features/index';
import { paystack } from '@kairox/api/lib/paystack';
import { auth } from '@kairox/auth';
import { db } from '@kairox/db';
import { LoggingHandlerPlugin } from '@orpc/experimental-pino';
import { onError } from '@orpc/server';
import { CompressionPlugin, RPCHandler } from '@orpc/server/fetch';
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import pino from 'pino';

const app = new Hono();

const pinoLogger = pino({
	transport:
		process.env.NODE_ENV === 'development'
			? {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'HH:MM:ss Z',
					},
				}
			: undefined,
});

app.use(
	'/*',
	cors({
		origin: (process.env.CORS_ORIGIN ?? '').split(','),
		allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
		allowHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			pinoLogger.error(error);
		}),
	],
	plugins: [
		new LoggingHandlerPlugin({
			logger: pinoLogger,
			generateId: () => Bun.randomUUIDv7(),
			logRequestResponse: true,
			logRequestAbort: true,
		}),
		new CompressionPlugin(),
	],
});

app.use('/*', async (c, next) => {
	const context = await createContext({ context: c });

	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: '/rpc',
		context: {
			...context,
			db,
			paystack,
		},
	});

	if (matched) {
		// @ts-expect-error - Copied directly from orpc docs
		return c.newResponse(response.body, response);
	}

	await next();
});

app.get('/', (c) => {
	return c.text('OK');
});

export default app;
