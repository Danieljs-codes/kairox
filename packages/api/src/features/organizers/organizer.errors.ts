import { CommonError, type CommonError as TCommonError } from '../../common.errors';

export type OrganizerError =
	| TCommonError
	| { _type: 'ORGANIZER_NOT_FOUND_ERROR'; organizerId: string }
	| { _type: 'ORGANIZER_ALREADY_EXISTS_ERROR'; userId: string };

export const OrganizerError = {
	...CommonError,

	notFound: (organizerId: string): OrganizerError => ({
		_type: 'ORGANIZER_NOT_FOUND_ERROR',
		organizerId,
	}),

	alreadyExists: (userId: string): OrganizerError => ({
		_type: 'ORGANIZER_ALREADY_EXISTS_ERROR',
		userId,
	}),
};
