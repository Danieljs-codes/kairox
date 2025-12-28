import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/organizer/events/$id/create-event')({
	validateSearch: z.object({
		step: z.enum(['details', 'tickets', 'media', 'publish']).default('details').catch('details'),
	}),
	loaderDeps: ({ search }) => ({ ...search }),
	loader: async ({ context, params, deps }) => {
		const event = await context.queryClient.fetchQuery(
			context.orpc.event.getEventDraft.queryOptions({
				input: {
					id: params.id,
				},
			}),
		);

		return { event };
	},
	staticData: {
		title: 'Create Event',
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { step } = Route.useSearch();
	return <div>Hello "/organizer/events/$id/create-event"!</div>;
}
