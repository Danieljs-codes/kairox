import { becomeOrganizerSchema } from '@kairox/schema/organizer';
import z from 'zod';
import { protectedProcedure, publicProcedure } from '../..';
import { BankAccountVerificationError, PaystackError, PaystackRecipientCreationError } from '../payments/payment.errors';
import { verifyBankAccount } from '../payments/payment.service';
import { DatabaseError, OrganizerAlreadyExistsError, OrganizerNotFoundError } from './organizer.errors';
import { createOrganizerProfile, getOrganizerProfile } from './organizer.service';

export const organizerRouter = {
	getCurrentOrganizerProfile: publicProcedure
		.errors({
			DATABASE_ERROR: {},
		})
		.handler(async ({ context, errors }) => {
			if (!context.session) {
				return {
					session: null,
					organizer: null,
				};
			}

			const result = await getOrganizerProfile(context.db, { id: context.session.user.id });

			if (!result.ok) {
				return result
					.match()
					.when(OrganizerNotFoundError, () => ({
						session: context.session,
						organizer: null,
					}))
					.when(DatabaseError, () => {
						throw errors.DATABASE_ERROR();
					})
					.run();
			}

			return {
				session: context.session,
				organizer: result.value,
			};
		}),
	verifyBankAccount: protectedProcedure
		.input(
			z.object({
				accountNumber: z.string().length(10),
				bankCode: z.string().min(1),
			}),
		)
		.errors({
			BANK_VERIFICATION_ERROR: {
				data: z.object({
					accountNumber: z.string(),
					bankCode: z.string(),
				}),
			},
			PAYSTACK_ERROR: {
				data: z.object({
					message: z.string(),
				}),
			},
		})
		.handler(async ({ context, input, errors }) => {
			const result = await verifyBankAccount(context.paystack, {
				accountNumber: input.accountNumber,
				bankCode: input.bankCode,
			});

			if (!result.ok) {
				return result
					.match()
					.when(BankAccountVerificationError, () => {
						throw errors.BANK_VERIFICATION_ERROR({
							data: { accountNumber: input.accountNumber, bankCode: input.bankCode },
						});
					})
					.when(PaystackError, (error) => {
						throw errors.PAYSTACK_ERROR({
							data: { message: error.message },
						});
					})
					.run();
			}

			return result.value;
		}),
	becomeOrganizer: protectedProcedure
		.input(becomeOrganizerSchema)
		.errors({
			DATABASE_ERROR: {},
			BANK_VERIFICATION_ERROR: {
				data: z.object({
					accountNumber: z.string(),
					bankCode: z.string(),
				}),
			},
			PAYSTACK_ERROR: {
				data: z.object({
					message: z.string(),
				}),
			},
			ORGANIZER_ALREADY_EXISTS: {},
			PAYSTACK_RECIPIENT_CREATION_ERROR: {
				data: z.object({
					message: z.string(),
				}),
			},
		})
		.handler(async ({ context, input, errors }) => {
			const result = await createOrganizerProfile(context.db, context.paystack, {
				...input,
				userId: context.session.user.id,
			});

			if (!result.ok) {
				return result
					.match()
					.when(DatabaseError, () => {
						throw errors.DATABASE_ERROR();
					})
					.when(BankAccountVerificationError, () => {
						throw errors.BANK_VERIFICATION_ERROR({
							data: { accountNumber: input.accountNumber, bankCode: input.bankCode },
						});
					})
					.when(PaystackError, (error) => {
						throw errors.PAYSTACK_ERROR({
							data: { message: error.message },
						});
					})
					.when(OrganizerAlreadyExistsError, () => {
						throw errors.ORGANIZER_ALREADY_EXISTS();
					})
					.when(PaystackRecipientCreationError, (error) => {
						throw errors.PAYSTACK_RECIPIENT_CREATION_ERROR({
							data: { message: error.message },
						});
					})
					.run();
			}

			return result.value;
		}),
};
