import { z } from 'zod';

export const becomeOrganizerSchema = z
	.object({
		organizationName: z
			.string()
			.min(2, 'Organization name must be at least 2 characters')
			.max(100, 'Organization name cannot exceed 100 characters'),

		accountNumber: z
			.string()
			.optional()
			.nullable()
			.transform((val) => val?.trim() ?? ''),

		bankCode: z
			.string()
			.optional()
			.nullable()
			.transform((val) => val?.trim() ?? ''),
	})
	.superRefine((data, ctx) => {
		const hasAccount = data.accountNumber !== '';
		const hasBank = data.bankCode !== '';

		if (hasAccount && !hasBank) {
			ctx.addIssue({
				code: 'custom',
				message: 'Please select a bank when an account number is entered.',
				path: ['bankCode'],
			});
		}

		if (!hasAccount && hasBank) {
			ctx.addIssue({
				code: 'custom',
				message: 'Please provide the account number when a bank is selected.',
				path: ['accountNumber'],
			});
		}

		if (hasAccount && data.accountNumber.length !== 10) {
			ctx.addIssue({
				code: 'custom',
				message: 'Account number must be exactly 10 digits.',
				path: ['accountNumber'],
			});
		}
	});

export type BecomeOrganizerInput = z.input<typeof becomeOrganizerSchema>;
export type BecomeOrganizerOutput = z.output<typeof becomeOrganizerSchema>;
