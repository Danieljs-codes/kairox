import { eventDetailsSchema } from '@kairox/schema/event';
import { match } from 'ts-pattern';
import z from 'zod';
import { organizerProcedure } from '../..';
import { getEventDetails, saveEventDetails } from './event.service';

export const eventRouter = {
	getEventDraft: organizerProcedure
		.input(
			z.object({
				id: z.uuidv7(),
			}),
		)
		.errors({
			DATABASE_ERROR: {},
		})
		.handler(async ({ context, input, errors }) => {
			const result = await getEventDetails(context.db, {
				eventId: input.id,
				organizerId: context.organizer.id,
			});

			if (!result.ok) {
				if (result.error._type === 'EVENT_NOT_FOUND_ERROR') {
					return { event: null };
				}
				if (result.error._type === 'DATABASE_ERROR') {
					throw errors.DATABASE_ERROR();
				}
			}

			return { event: result.value ?? null };
		}),
	saveEventDetails: organizerProcedure
		.input(eventDetailsSchema)
		.errors({
			DATABASE_ERROR: {},
			SLUG_ALREADY_TAKEN: {
				data: z.object({
					slug: z.string(),
				}),
			},
		})
		.handler(async ({ context, input, errors }) => {
			const result = await saveEventDetails(context.db, {
				eventId: input.id,
				organizerId: context.organizer.id,
				data: input,
			});

			if (!result.ok) {
				match(result.error)
					.with({ _type: 'DATABASE_ERROR' }, () => {
						throw errors.DATABASE_ERROR();
					})
					.with({ _type: 'SLUG_ALREADY_TAKEN' }, (_error) => {
						throw errors.SLUG_ALREADY_TAKEN({
							data: {
								slug: _error.slug,
							},
						});
					})
					.exhaustive();
			}

			return { eventId: result.value };
		}),
};
