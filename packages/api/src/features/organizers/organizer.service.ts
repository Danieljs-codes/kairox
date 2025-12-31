import { Result } from 'typescript-result';
import { Kysely } from 'kysely';
import { OrganizerError } from './organizer.errors';
import type { Database } from '@kairox/db';
import type { PaystackClient } from '../../lib/paystack';
import { PaymentError as PaymentError } from '../payments/payment.errors';
import { verifyBankAccount } from '../payments/payment.service';
import type { SnakeToCamelObject } from '../../lib/utils';

type BanksResponse = Awaited<ReturnType<PaystackClient['verification']['resolveAccount']>>;

export type VerifyBankAccountResponse = NonNullable<BanksResponse['data']>;

export function getOrganizerProfile(db: Kysely<Database>, deps: { id: string }) {
	return Result.gen(function* () {
		const result = yield* Result.fromAsyncCatching(
			async () => {
				const org = await db
					.selectFrom('organizer')
					.select(['id', 'name'])
					.where('ownerId', '=', deps.id)
					.executeTakeFirst();

				return org;
			},
			(error) => OrganizerError.database(error),
		);

		if (!result) {
			return yield* Result.error(OrganizerError.notFound(deps.id));
		}

		return result;
	});
}

export type CreateOrganizerProfileInput = {
	userId: string;
	accountNumber?: string;
	bankCode?: string;
	organizationName: string;
};

export function createOrganizerProfile(
	db: Kysely<Database>,
	paystack: PaystackClient,
	input: CreateOrganizerProfileInput,
) {
	return Result.gen(function* () {
		const existing = yield* Result.fromAsyncCatching(
			async () => {
				const org = await db
					.selectFrom('organizer')
					.select('id')
					.where('ownerId', '=', input.userId)
					.executeTakeFirst();

				return org;
			},
			(error) => OrganizerError.database(error),
		);

		if (existing) {
			return yield* Result.error(OrganizerError.alreadyExists(input.userId));
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
				(error) => PaymentError.paystackRecipientCreation('Failed to create recipient', error),
			);

			recipientCode = recipientResult.data?.recipient_code;
		}

		const newOrganizer = yield* Result.fromAsyncCatching(
			async () => {
				const result = await db
					.insertInto('organizer')
					.values({
						ownerId: input.userId,
						name: input.organizationName,
						bankCode: input.bankCode,
						accountNumber: input.accountNumber,
						accountName: bankDetails?.accountName,
						paystackRecipientCode: recipientCode,
					})
					.returningAll()
					.executeTakeFirstOrThrow();

				return result;
			},
			(error) => OrganizerError.database(error),
		);

		return newOrganizer;
	});
}
