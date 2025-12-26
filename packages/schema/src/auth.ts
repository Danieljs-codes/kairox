import { z } from 'zod';

export const signUpSchema = z.object({
	email: z
		.email({
			error: 'Invalid email address',
		})
		.max(255, 'Email is too long'),
	password: z
		.string({
			error: 'Password is required',
		})
		.min(8, 'Password must be at least 8 characters')
		.max(100, 'Password is too long'),
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

export const signInSchema = z.object({
	email: z.email({
		error: 'Invalid email address',
	}),
	password: z
		.string({
			error: 'Password is required',
		})
		.min(1, 'Password is required'),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpOutput = z.output<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type SignInOutput = z.output<typeof signInSchema>;
