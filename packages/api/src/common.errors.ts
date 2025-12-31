export type CommonError =
	| { _type: 'DATABASE_ERROR'; cause?: unknown }
	| { _type: 'VALIDATION_ERROR'; message: string; field?: string }
	| { _type: 'NOT_FOUND_ERROR'; resource: string; id: string };

export const CommonError = {
	database: (cause?: unknown): CommonError => ({
		_type: 'DATABASE_ERROR',
		cause,
	}),

	validation: (message: string, field?: string): CommonError => ({
		_type: 'VALIDATION_ERROR',
		message,
		field,
	}),

	notFound: (resource: string, id: string): CommonError => ({
		_type: 'NOT_FOUND_ERROR',
		resource,
		id,
	}),
};
