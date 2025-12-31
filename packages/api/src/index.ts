import { ORPCError, os } from '@orpc/server';

import { db } from '@kairox/db';
import type { Context } from './context';

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError('UNAUTHORIZED');
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

type OrganizerMiddlewareContext = Omit<Context, 'session'> & {
	session: NonNullable<Context['session']>;
};

const requireAuthenticatedOrganizer = o
	.$context<OrganizerMiddlewareContext>()
	.middleware(async ({ context, next }) => {
		// Get organizer
		const result = await db
			.selectFrom('organizer')
			.selectAll()
			.where('ownerId', '=', context.session.user.id)
			.executeTakeFirst();

		if (!result) {
			throw new ORPCError('UNAUTHORIZED');
		}

		return next({
			context: {
				session: context.session,
				organizer: result,
			},
		});
	});

export const protectedProcedure = publicProcedure.use(requireAuth);

export const organizerProcedure = protectedProcedure.use(requireAuthenticatedOrganizer);
