import z from 'zod';
import { organizerProcedure } from '../..';
import { DatabaseError } from '../organizers/organizer.errors';
import { EventNotFoundError } from './event.errors';
import { getEventDetails } from './event.service';

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
				return result
					.match()
					.when(EventNotFoundError, () => {
						return { event: null };
					})
					.when(DatabaseError, () => {
						throw errors.DATABASE_ERROR();
					})
					.run();
			}

			return { event: result.value };
		}),
};
