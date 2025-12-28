import z from 'zod';
import { publicProcedure } from '../..';
import { getAllBanks, verifyBankAccount } from './payment.service';
import { BankAccountVerificationError, PaystackError } from './payment.errors';

export const paymentRouter = {
	getAllBanks: publicProcedure
		.errors({
			PAYSTACK_ERROR: {
				data: z.object({
					message: z.string(),
				}),
			},
		})
		.handler(async ({ context, errors }) => {
			const result = await getAllBanks(context.paystack);

			if (!result.ok) {
				return result
					.match()
					.when(PaystackError, (error) => {
						throw errors.PAYSTACK_ERROR({
							data: {
								message: error.message,
							},
						});
					})
					.run();
			}

			return { banks: result.value };
		}),
	verifyBankAccount: publicProcedure
		.input(
			z.object({
				accountNumber: z.string().length(10, 'Account number must be 10 digits'),
				bankCode: z.string().min(1, 'Bank code is required'),
			}),
		)
		.errors({
			VERIFICATION_FAILED: {
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
					.when(BankAccountVerificationError, (error) => {
						throw errors.VERIFICATION_FAILED({
							data: {
								message: error.message,
							},
						});
					})
					.run();
			}

			return result.value;
		}),
};
