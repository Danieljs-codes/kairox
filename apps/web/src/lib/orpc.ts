import type { AppRouterClient } from '@kairox/api/features/index';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 3, // 3 minutes
		},
	},
});

export const link = new RPCLink({
	url: `${window.location.protocol}//${window.location.hostname}:3000/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: 'include',
		});
	},
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
