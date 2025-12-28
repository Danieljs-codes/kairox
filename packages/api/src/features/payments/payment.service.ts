import { Result } from 'typescript-result';
import type { PaystackClient } from '../../lib/paystack';
import { BankAccountVerificationError, PaystackError } from './payment.errors';

export function getAllBanks(paystack: PaystackClient) {
	return Result.gen(function* () {
		const banks = yield* Result.fromAsyncCatching(
			async () => {
				const response = await paystack.misc.banks();

				if (!response.data) {
					throw new PaystackError();
				}

				return response.data;
			},
			(error) => new PaystackError('Failed to fetch banks', error),
		);

		return banks;
	});
}

export function verifyBankAccount(
	paystack: PaystackClient,
	deps: { accountNumber: string; bankCode: string },
) {
	return Result.gen(function* () {
		const result = yield* Result.fromAsyncCatching(
			async () => {
				const response = await paystack.verification.resolveAccount({
					account_number: deps.accountNumber,
					bank_code: deps.bankCode,
				});

				if (!response.status || !response.data) {
					throw new BankAccountVerificationError(response.message ?? 'Could not resolve account');
				}

				return response.data;
			},
			(error) =>
				error instanceof BankAccountVerificationError
					? error
					: new PaystackError('Failed to verify bank account', error),
		);

		return {
			accountNumber: result.account_number,
			accountName: result.account_name,
		};
	});
}
