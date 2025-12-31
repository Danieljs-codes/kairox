import { CommonError, type CommonError as TCommonError } from '../../common.errors';

export type PaymentError =
	| TCommonError
	| { _type: 'PAYSTACK_ERROR'; message: string; cause?: unknown }
	| { _type: 'BANK_ACCOUNT_VERIFICATION_ERROR'; message: string; cause?: unknown }
	| { _type: 'PAYSTACK_RECIPIENT_CREATION_ERROR'; message: string; cause?: unknown };

export const PaymentError = {
	...CommonError,

	paystack: (message = 'Paystack operation failed', cause?: unknown): PaymentError => ({
		_type: 'PAYSTACK_ERROR',
		message,
		cause,
	}),

	bankAccountVerification: (
		message = 'Failed to verify bank account',
		cause?: unknown,
	): PaymentError => ({
		_type: 'BANK_ACCOUNT_VERIFICATION_ERROR',
		message,
		cause,
	}),

	paystackRecipientCreation: (
		message = 'Failed to create Paystack recipient',
		cause?: unknown,
	): PaymentError => ({
		_type: 'PAYSTACK_RECIPIENT_CREATION_ERROR',
		message,
		cause,
	}),
};
