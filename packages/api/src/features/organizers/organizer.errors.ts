export class DatabaseError extends Error {
	readonly type = 'database-error';
	constructor(cause?: unknown) {
		super('Database operation failed');
		this.cause = cause;
	}
}

export class OrganizerNotFoundError extends Error {
	readonly type = 'organizer-not-found-error';
	constructor(public readonly organizerId: string) {
		super(`Organizer with ID ${organizerId} not found.`);
	}
}

export class OrganizerAlreadyExistsError extends Error {
	readonly type = 'organizer-already-exists-error';
	constructor(public readonly userId: string) {
		super(`User ${userId} already has an organizer profile.`);
	}
}
