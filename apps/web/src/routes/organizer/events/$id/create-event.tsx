import { BannerUpload } from '@/components/organizer/banner-upload';
import { EventDetails } from '@/components/organizer/event-details';
import { TicketsCreation } from '@/components/organizer/tickets-creation';
import { setFlashCookie } from '@/lib/cookie';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
	Progress,
	ProgressIndicator,
	ProgressLabel,
	ProgressTrack,
	ProgressValue,
} from '@ui/progress';
import { match } from 'ts-pattern';
import { z } from 'zod';

const STEPS = ['details', 'media', 'tickets', 'publish'] as const;

export const Route = createFileRoute('/organizer/events/$id/create-event')({
	validateSearch: z.object({
		step: z.enum(STEPS).default('details').catch('details'),
	}),
	loaderDeps: ({ search }) => ({ ...search }),
	beforeLoad: async ({ context, params, search }) => {
		const event = await context.queryClient.fetchQuery(
			context.orpc.event.getEventDraft.queryOptions({
				input: {
					id: params.id,
				},
			}),
		);

		const currentStepIndex = STEPS.indexOf(search.step);
		const eventData = event?.event;
		const hasDetails =
			!!eventData && eventData.title && eventData.startDate && eventData.venueAddress;
		const hasMedia = !!eventData && eventData.banners && eventData.banners.length > 0;
		const hasTickets = !!eventData && eventData.ticketTypes && eventData.ticketTypes.length > 0;

		const requiredStepIndex = match(currentStepIndex)
			.with(1, () => (!hasDetails ? 0 : null))
			.with(2, () => (!hasDetails || !hasMedia ? 1 : null))
			.with(3, () => (!hasDetails || !hasMedia || !hasTickets ? 2 : null))
			.otherwise(() => null);

		if (requiredStepIndex !== null) {
			const requiredStep = STEPS[requiredStepIndex];
			setFlashCookie({
				type: 'info',
				title: 'Complete previous step first',
				description: `Please complete ${EVENT_CONFIG[requiredStep].title.toLowerCase()} before continuing.`,
			});

			throw redirect({
				to: '/organizer/events/$id/create-event',
				params: { id: params.id },
				search: { step: requiredStep },
			});
		}

		return { event, step: search.step };
	},
	staticData: {
		title: 'Create Event',
	},
	component: RouteComponent,
});

export const EVENT_CONFIG = {
	details: {
		step: 1,
		title: 'Event Details',
		description: 'Add the basic information about your event',
	},
	media: {
		step: 2,
		title: 'Media',
		description: 'Upload images and videos for your event',
	},
	tickets: {
		step: 3,
		title: 'Tickets',
		description: 'Set up ticket types and pricing',
	},
	publish: {
		step: 4,
		title: 'Publish',
		description: 'Review and publish your event',
	},
} as const;

function RouteComponent() {
	const { step } = Route.useSearch();
	const { id } = Route.useParams();
	const currentConfig = EVENT_CONFIG[step];
	const progress = (currentConfig.step / STEPS.length) * 100;
	return (
		<div className="md:max-w-md mx-auto">
			<Progress value={progress} className="mb-8">
				<div className="flex items-center justify-between gap-2">
					<ProgressLabel className="font-medium">{currentConfig.title}</ProgressLabel>
					<ProgressValue className="font-medium" />
				</div>
				<ProgressTrack>
					<ProgressIndicator />
				</ProgressTrack>
			</Progress>
			<div>
				{match(step)
					.with('details', () => <EventDetails />)
					.with('media', () => <BannerUpload eventId={id} />)
					.with('tickets', () => <TicketsCreation />)
					.with('publish', () => <div>Publish</div>)
					.exhaustive()}
			</div>
		</div>
	);
}
