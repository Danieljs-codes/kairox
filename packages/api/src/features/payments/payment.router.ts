import z from 'zod';
import { publicProcedure } from '../..';
import { getAllBanks, verifyBankAccount } from './payment.service';

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
				if (result.error._type === 'PAYSTACK_ERROR') {
					throw errors.PAYSTACK_ERROR({
						data: {
							message: result.error.message,
						},
					});
				}
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
				if (result.error._type === 'BANK_ACCOUNT_VERIFICATION_ERROR') {
					throw errors.VERIFICATION_FAILED({
						data: {
							message: result.error.message,
						},
					});
				}
			}

			return result.value;
		}),
};
