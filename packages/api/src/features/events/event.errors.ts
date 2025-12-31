import { CommonError, type CommonError as TCommonError } from '../../common.errors';

export type EventError =
	| TCommonError
	| { _type: 'EVENT_NOT_FOUND_ERROR'; eventId: string }
	| { _type: 'SLUG_GENERATION_FAILED'; attempts: number; title: string };

export const EventError = {
	...CommonError,

	notFound: (eventId: string): EventError => ({
		_type: 'EVENT_NOT_FOUND_ERROR',
		eventId,
	}),

	slugGenerationFailed: (attempts: number, title: string): EventError => ({
		_type: 'SLUG_GENERATION_FAILED',
		attempts,
		title,
	}),
};
