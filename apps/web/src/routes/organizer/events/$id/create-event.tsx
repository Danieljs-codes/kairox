import { EventDetails } from '@/components/organizer/event-details';
import { setFlashCookie } from '@/lib/cookie';
import { createFileRoute } from '@tanstack/react-router';
import {
	Progress,
	ProgressIndicator,
	ProgressLabel,
	ProgressTrack,
	ProgressValue,
} from '@ui/progress';
import { match } from 'ts-pattern';
import { z } from 'zod';

const STEPS = ['details', 'tickets', 'media', 'publish'] as const;

function canAccessStep(step: (typeof STEPS)[number], hasEventData: boolean) {
	if (step === 0) return true;
	return hasEventData;
}

export const Route = createFileRoute('/organizer/events/$id/create-event')({
	validateSearch: z.object({
		step: z.enum(['details', 'tickets', 'media', 'publish']).default('details').catch('details'),
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
		const hasEventData = !!event;

		if (!canAccessStep(currentStepIndex, hasEventData)) {
			const previousStep = STEPS[currentStepIndex - 1];
			if (previousStep) {
				setFlashCookie({
					type: 'info',
					title: 'Complete previous step first',
					description: `Please complete ${EVENT_CONFIG[previousStep].title.toLowerCase()} before continuing.`,
				});

				throw redirect({
					to: '/organizer/events/$id/create-event',
					params: { id: params.id },
					search: { step: previousStep },
				});
			}
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
	tickets: {
		step: 2,
		title: 'Tickets',
		description: 'Set up ticket types and pricing',
	},
	media: {
		step: 3,
		title: 'Media',
		description: 'Upload images and videos for your event',
	},
	publish: {
		step: 4,
		title: 'Publish',
		description: 'Review and publish your event',
	},
} as const;

function RouteComponent() {
	const { step } = Route.useSearch();
	const currentConfig = EVENT_CONFIG[step];
	const progress = (currentConfig.step / STEPS.length) * 100;
	return (
		<div className="md:max-w-sm mx-auto">
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
					.with('tickets', () => <div>Tickets</div>)
					.with('media', () => <div>Media</div>)
					.with('publish', () => <div>Publish</div>)
					.exhaustive()}
			</div>
		</div>
	);
}
