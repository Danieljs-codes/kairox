import type { Database } from '@kairox/db';
import type { EventDetailsOutput } from '@kairox/schema/event';
import { Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { Result } from 'typescript-result';
import { generateUniqueSlug } from '../../utils/slug';

export function getEventDetails(
	db: Kysely<Database>,
	deps: { eventId: string; organizerId: string },
) {
	const notFound = (eventId: string) => ({
		_type: 'EVENT_NOT_FOUND_ERROR' as const,
		eventId,
	});

	const database = (cause?: unknown) => ({
		_type: 'DATABASE_ERROR' as const,
		cause,
	});

	return Result.gen(function* () {
		const result = yield* Result.fromAsyncCatching(
			async () => {
				const event = await db
					.selectFrom('event')
					.selectAll('event')
					.select((eb) => [
						jsonArrayFrom(
							eb
								.selectFrom('ticketType')
								.selectAll('ticketType')
								.whereRef('ticketType.eventId', '=', 'event.id'),
						).as('ticketTypes'),
						jsonArrayFrom(
							eb
								.selectFrom('eventBanner')
								.selectAll('eventBanner')
								.whereRef('eventBanner.eventId', '=', 'event.id')
								.orderBy('eventBanner.sortOrder', 'asc'),
						).as('banners'),
					])
					.where('event.id', '=', deps.eventId)
					.where('event.organizerId', '=', deps.organizerId)
					.executeTakeFirst();

				return event;
			},
			(error) => database(error),
		);

		if (!result) return yield* Result.error(notFound(deps.eventId));

		return result;
	});
}

export function saveEventDetails(
	db: Kysely<Database>,
	deps: { eventId: string; organizerId: string; data: EventDetailsOutput },
) {
	const database = (cause?: unknown) => ({
		_type: 'DATABASE_ERROR' as const,
		cause,
	});

	const slugTaken = (slug: string) => ({
		_type: 'SLUG_ALREADY_TAKEN' as const,
		slug,
	});

	return Result.gen(function* () {
		const slug = deps.data.slug;

		if (slug) {
			const exists = yield* Result.fromAsyncCatching(
				() =>
					db
						.selectFrom('event')
						.select('id')
						.where('slug', '=', slug)
						.where('id', '!=', deps.eventId)
						.executeTakeFirst(),
				(error) => database(error),
			);

			if (exists) return yield* Result.error(slugTaken(slug));
		}

		const finalSlug = slug ?? (yield* generateUniqueSlug(db, deps.data.title));

		const result = yield* Result.fromAsyncCatching(
			async () => {
				return await db
					.insertInto('event')
					.values({
						id: deps.eventId,
						organizerId: deps.organizerId,
						title: deps.data.title,
						slug: finalSlug,
						description: deps.data.description,
						startDate: deps.data.startDate,
						endDate: deps.data.endDate,
						timezone: deps.data.timezone,
						venueAddress: deps.data.address,
					})
					.onConflict(oc =>
						oc
							.column('id')
							.doUpdateSet({
								title: (eb) => eb.ref('excluded.title'),
								slug: (eb) => eb.ref('excluded.slug'),
								description: (eb) => eb.ref('excluded.description'),
								startDate: (eb) => eb.ref('excluded.startDate'),
								endDate: (eb) => eb.ref('excluded.endDate'),
								timezone: (eb) => eb.ref('excluded.timezone'),
								venueAddress: (eb) => eb.ref('excluded.venueAddress'),
							}),
					)
					.returning(['id as eventId'])
					.executeTakeFirst();
			},
			(error) => database(error),
		);

		return result;
	});
}
