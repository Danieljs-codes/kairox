import z from 'zod';

export const EVENT_DESCRIPTION_MAX_LENGTH = 1000;

export const eventDetailsSchema = z
	.object({
		id: z.uuidv7(),
		title: z
			.string({ error: 'Please enter a name for your event' })
			.min(3, { error: 'The event name must be at least 3 characters' })
			.max(100, { error: 'The event name cannot exceed 100 characters' }),

		slug: z
			.string({ error: 'Please enter a URL slug' })
			.min(3, { error: 'The slug must be at least 3 characters' })
			.max(100, { error: 'The slug cannot exceed 100 characters' })
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
				error: 'The slug must be lowercase and contain only letters, numbers, and hyphens',
			})
			.nullish(),
		description: z
			.string()
			.max(EVENT_DESCRIPTION_MAX_LENGTH + 3000, {
				error: `Description cannot exceed ${EVENT_DESCRIPTION_MAX_LENGTH + 3000} characters`,
			})
			.optional(),
		address: z
			.string({ error: 'Please enter an event address' })
			.min(1, { error: 'Please enter an event address' })
			.max(500, { error: 'Address cannot exceed 500 characters' }),
		startDate: z.nullable(z.date()).pipe(z.date({ error: 'Please select a start date' })),
		endDate: z.nullable(z.date()).pipe(z.date({ error: 'Please select an end date' })),
		timezone: z
			.string({ error: 'Please select a timezone' })
			.min(1, { error: 'Please select a timezone' }),
	})
	.superRefine((data, ctx) => {
		const { startDate, endDate } = data;
		const now = new Date();

		if (startDate < now) {
			ctx.addIssue({
				code: 'custom',
				message: 'The event start date cannot be in the past',
				path: ['startDate'],
			});
		}

		if (endDate < now) {
			ctx.addIssue({
				code: 'custom',
				message: 'The event end date cannot be in the past',
				path: ['endDate'],
			});
		} else if (endDate.getTime() === startDate.getTime()) {
			ctx.addIssue({
				code: 'custom',
				message: 'The event end time cannot be exactly the same as the start time',
				path: ['endDate'],
			});
		} else if (endDate < startDate) {
			ctx.addIssue({
				code: 'custom',
				message: 'The event end date must be after the start date',
				path: ['endDate'],
			});
		}
	});

export type EventDetailsInput = z.input<typeof eventDetailsSchema>;
export type EventDetailsOutput = z.output<typeof eventDetailsSchema>;
