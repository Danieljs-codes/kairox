import z from 'zod';

export const eventDetailsSchema = z
	.object({
		title: z
			.string({ error: 'Title is required' })
			.min(3, { error: 'Title must be at least 3 characters' })
			.max(100, { error: 'Title cannot exceed 100 characters' }),

		slug: z
			.string({ error: 'Slug is required' })
			.min(3, { error: 'Slug must be at least 3 characters' })
			.max(100, { error: 'Slug cannot exceed 100 characters' })
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
				error: 'Slug must be lowercase with hyphens only (e.g., my-event-name)',
			}),
		description: z
			.string()
			.max(5000, { error: 'Description cannot exceed 5000 characters' })
			.optional(),
		address: z
			.string({ error: 'Address is required' })
			.min(1, { error: 'Address is required' })
			.max(500, { error: 'Address cannot exceed 500 characters' }),
		startDate: z.nullable(z.coerce.date()).pipe(z.date({ error: 'Start date is required' })),
		endDate: z.nullable(z.coerce.date()).pipe(z.date({ error: 'End date is required' })),
		timezone: z
			.nullable(z.string())
			.pipe(z.string({ error: 'Timezone is required' }).min(1, { error: 'Timezone is required' })),
		feeBearer: z
			.nullable(z.enum(['ORGANIZER', 'CUSTOMER']))
			.pipe(
				z.enum(['ORGANIZER', 'CUSTOMER'], { error: 'Fee bearer must be ORGANIZER or CUSTOMER' }),
			),
	})
	.refine((data) => data.endDate > data.startDate, {
		error: 'End date must be after start date',
		path: ['endDate'],
		when(payload) {
			return eventDetailsSchema.pick({ endDate: true, startDate: true }).safeParse(payload.value)
				.success;
		},
	});

export type EventDetailsInput = z.input<typeof eventDetailsSchema>;
export type EventDetailsOutput = z.output<typeof eventDetailsSchema>;
