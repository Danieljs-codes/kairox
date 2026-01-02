import type { RouterClient } from '@orpc/server';

import { publicProcedure } from '../index';
import { eventRouter } from './events/event.router';
import { organizerRouter } from './organizers/organizer.router';
import { paymentRouter } from './payments/payment.router';
import { bannerRouter } from './banners/banner.router';

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return 'OK';
	}),
	organizer: organizerRouter,
	payment: paymentRouter,
	event: eventRouter,
	banner: bannerRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
