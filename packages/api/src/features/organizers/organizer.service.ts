import { Result } from 'typescript-result';
import {
	DatabaseError,
	OrganizerAlreadyExistsError,
	OrganizerNotFoundError,
} from './organizer.errors';
import type { DB } from '@kairox/db';
import { organizer } from '@kairox/db/schema';
import type { PaystackClient } from '../../lib/paystack';
import { verifyBankAccount } from '../payments/payment.service';
import { PaystackRecipientCreationError } from '../payments/payment.errors';
import type { SnakeToCamelObject } from '../../lib/utils';

type BanksResponse = Awaited<ReturnType<PaystackClient['verification']['resolveAccount']>>;

export type VerifyBankAccountResponse = NonNullable<BanksResponse['data']>;

export function getOrganizerProfile(db: DB, deps: { id: string }) {
	return Result.gen(function* () {
		const org = yield* Result.fromAsyncCatching(
			() =>
				db.query.organizer.findFirst({
					where: { ownerId: deps.id },
					columns: { id: true, name: true },
				}),
			(error) => new DatabaseError(error),
		);

		if (!org) {
			return yield* Result.error(new OrganizerNotFoundError(deps.id));
		}

		return org;
	});
}

export type CreateOrganizerProfileInput = {
	userId: string;
	accountNumber?: string;
	bankCode?: string;
	organizationName: string;
};

export function createOrganizerProfile(
	db: DB,
	paystack: PaystackClient,
	input: CreateOrganizerProfileInput,
) {
	return Result.gen(function* () {
		const existing = yield* Result.fromAsyncCatching(
			() =>
				db.query.organizer.findFirst({
					where: { ownerId: input.userId },
					columns: { id: true },
				}),
			(error) => new DatabaseError(error),
		);

		if (existing) {
			return yield* Result.error(new OrganizerAlreadyExistsError(input.userId));
		}

		let bankDetails: SnakeToCamelObject<VerifyBankAccountResponse> | undefined;
		let recipientCode: string | undefined;

		if (input.accountNumber && input.bankCode) {
			const verificationResult = yield* verifyBankAccount(paystack, {
				accountNumber: input.accountNumber,
				bankCode: input.bankCode,
			});

			bankDetails = verificationResult;

			const recipientResult = yield* Result.fromAsyncCatching(
				() =>
					paystack.recipient.create({
						type: 'nuban',
						name: verificationResult.accountName,
						account_number: verificationResult.accountNumber,
						bank_code: input.bankCode!,
						currency: 'NGN',
					}),
				(error) => new PaystackRecipientCreationError('Failed to create recipient', error),
			);

			recipientCode = recipientResult.data?.recipient_code;
		}

		const newOrganizer = yield* Result.fromAsyncCatching(
			() =>
				db
					.insert(organizer)
					.values({
						ownerId: input.userId,
						name: input.organizationName,
						bankCode: input.bankCode,
						accountNumber: input.accountNumber,
						accountName: bankDetails?.accountName,
						paystackRecipientCode: recipientCode,
					})
					.returning(),
			(error) => new DatabaseError(error),
		);

		return newOrganizer[0];
	});
}
