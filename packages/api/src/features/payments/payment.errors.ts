export class PaystackError extends Error {
	readonly type = 'paystack-error';
	constructor(message = 'Paystack operation failed', cause?: unknown) {
		super(message);
		this.cause = cause;
	}
}

export class BankAccountVerificationError extends Error {
	readonly type = 'bank-account-verification-error';
	constructor(message = 'Failed to verify bank account', cause?: unknown) {
		super(message);
		this.cause = cause;
	}
}

export class PaystackRecipientCreationError extends Error {
	readonly type = 'paystack-recipient-creation-error';
	constructor(message = 'Failed to create Paystack recipient', cause?: unknown) {
		super(message);
		this.cause = cause;
	}
}
