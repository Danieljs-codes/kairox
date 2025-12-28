export class EventNotFoundError extends Error {
	readonly type = 'event-not-found-error';
	constructor(public readonly eventId: string) {
		super(`Event with ID ${eventId} not found.`);
	}
}
