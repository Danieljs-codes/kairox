import type { RouterClient } from '@orpc/server';

import { publicProcedure } from '../index';
import { organizerRouter } from './organizers/organizer.router';
import { paymentRouter } from './payments/payment.router';

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return 'OK';
	}),
	organizer: organizerRouter,
	payment: paymentRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
