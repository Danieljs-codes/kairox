import type { DB } from '@kairox/db';
import { Result } from 'typescript-result';
import { DatabaseError } from '../organizers/organizer.errors';
import { EventNotFoundError } from './event.errors';

export function getEventDetails(db: DB, deps: { eventId: string; organizerId: string }) {
	return Result.gen(function* () {
		const org = yield* Result.fromAsyncCatching(
			async () => {
				const event = await db.query.event.findFirst({
					where: {
						organizerId: deps.organizerId,
						id: deps.eventId,
					},
					with: {
						ticketTypes: true,
						banners: {
							orderBy: {
								sortOrder: 'asc',
							},
						},
					},
				});

				return event;
			},
			(error) => new DatabaseError(error),
		);

		if (!org) return yield* Result.error(new EventNotFoundError(deps.eventId));

		return yield* Result.ok(org);
	});
}
