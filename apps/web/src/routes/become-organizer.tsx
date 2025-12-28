import { BankAccountConfirmation } from '@/components/bank-account-confirmation';
import { useAppForm } from '@/components/form-factory';
import { Logo } from '@/components/logo';
import { useBanks } from '@/hooks/use-banks';
import { setFlashCookie } from '@/lib/cookie';
import { orpc } from '@/lib/orpc';
import { becomeOrganizerSchema, type BecomeOrganizerInput } from '@kairox/schema/organizer';
import { isDefinedError } from '@orpc/client';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Button } from '@ui/button';
import {
	Combobox,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
} from '@ui/combobox';
import { Field, FieldError, FieldLabel } from '@ui/field';
import { Spinner } from '@ui/spinner';
import { toastManager } from '@ui/toast';
import { useState } from 'react';
import { match } from 'ts-pattern';

export const Route = createFileRoute('/become-organizer')({
	beforeLoad: async ({ context }) => {
		const profile = await context.queryClient.fetchQuery(
			context.orpc.organizer.getCurrentOrganizerProfile.queryOptions(),
		);

		if (!profile.session) {
			setFlashCookie({
				type: 'warning',
				title: 'Authentication Required',
				description: 'Please sign in to become an organizer',
			});
			throw redirect({
				to: '/sign-in',
			});
		}

		if (profile.session && profile.organizer) {
			setFlashCookie({
				type: 'info',
				title: 'Already an Organizer',
				description: 'Redirecting to your dashboard',
			});
			throw redirect({
				to: '/organizer/dashboard',
			});
		}

		return profile;
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			context.orpc.payment.getAllBanks.queryOptions({
				staleTime: Number.POSITIVE_INFINITY,
			}),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data: banks } = useBanks();
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [verifiedAccount, setVerifiedAccount] = useState<{
		accountName: string;
		accountNumber: string;
		bankCode: string;
		bankName: string;
	} | null>(null);
	const [pendingFormValue, setPendingFormValue] = useState<BecomeOrganizerInput | null>(null);

	const { mutateAsync: verifyBankAccount } = useMutation(
		orpc.organizer.verifyBankAccount.mutationOptions({
			onError: (error) => {
				if (!isDefinedError(error)) {
					toastManager.add({
						type: 'error',
						title: 'Something went wrong',
						description: 'Please try again. If the issue persists, contact support.',
					});
					return;
				}

				match(error.code)
					.with('BANK_VERIFICATION_ERROR', () => {
						toastManager.add({
							type: 'error',
							title: 'Invalid account details',
							description: 'Please double-check your account number and bank.',
						});
					})
					.with('PAYSTACK_ERROR', () => {
						toastManager.add({
							type: 'error',
							title: 'Verification unavailable',
							description: 'Please try again in a few minutes.',
						});
					})
					.exhaustive();
			},
		}),
	);

	const { mutateAsync: becomeOrganizerMutation, isPending: isCreating } = useMutation(
		orpc.organizer.becomeOrganizer.mutationOptions({
			onSuccess: async (_, __, ___, { client }) => {
				await client.invalidateQueries({
					queryKey: orpc.organizer.getCurrentOrganizerProfile.queryOptions().queryKey,
				});
				toastManager.add({
					type: 'success',
					title: 'Profile created',
					description: "You're all set! Redirecting to your dashboard.",
				});
				navigate({
					to: '/organizer/dashboard',
				});
			},

			onError: (error) => {
				if (!isDefinedError(error)) {
					toastManager.add({
						type: 'error',
						title: 'Something went wrong',
						description: 'Please try again. If the issue persists, contact support.',
					});
					return;
				}

				match(error.code)
					.with('DATABASE_ERROR', () => {
						toastManager.add({
							type: 'error',
							title: 'Could not save profile',
							description: 'Please try again in a moment.',
						});
					})
					.with('BANK_VERIFICATION_ERROR', () => {
						toastManager.add({
							type: 'error',
							title: 'Invalid account details',
							description: 'Please double-check your account number and bank.',
						});
					})
					.with('PAYSTACK_ERROR', () => {
						toastManager.add({
							type: 'error',
							title: 'Service temporarily unavailable',
							description: 'Please try again in a few minutes.',
						});
					})
					.with('ORGANIZER_ALREADY_EXISTS', () => {
						toastManager.add({
							type: 'info',
							title: 'Already registered',
							description: 'Taking you to your dashboard.',
						});
						navigate({
							to: '/organizer/dashboard',
						});
					})
					.with('PAYSTACK_RECIPIENT_CREATION_ERROR', () => {
						toastManager.add({
							type: 'error',
							title: 'Payment setup failed',
							description:
								"Your profile was created but we couldn't link your bank. You can add it later.",
						});
					})
					.exhaustive();
			},
		}),
	);

	const handleConfirmAndCreate = async () => {
		if (!pendingFormValue) return;
		await becomeOrganizerMutation(pendingFormValue);
		setShowConfirmation(false);
		setPendingFormValue(null);
		setVerifiedAccount(null);
	};

	const form = useAppForm({
		defaultValues: {
			organizationName: '',
			accountNumber: '',
			bankCode: '',
		} as BecomeOrganizerInput,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: becomeOrganizerSchema,
			onSubmitAsync: async ({ value }) => {
				if (value.accountNumber && value.bankCode) {
					const result = await verifyBankAccount({
						accountNumber: value.accountNumber,
						bankCode: value.bankCode,
					});
					const bankName = banks.find((b) => b.code === value.bankCode)?.name ?? 'Unknown Bank';
					setVerifiedAccount({
						accountName: result.accountName,
						accountNumber: result.accountNumber,
						bankCode: value.bankCode,
						bankName,
					});
					setPendingFormValue(value);
					setShowConfirmation(true);
				} else {
					await becomeOrganizerMutation(value);
				}
			},
		},
	});

	return (
		<>
			<div className="p-4 min-h-svh grid place-content-center max-w-md mx-auto">
				<Logo
					classNames={{
						container: 'mb-4',
						icon: 'size-6',
					}}
				/>
				<div className="flex flex-col gap-0.5">
					<h2 className="font-semibold text-xl">Create organizer profile</h2>
					<p className="text-muted-foreground text-sm">
						Create your organizer profile. Bank details are optional and can be added later from
						your dashboard.
					</p>
				</div>
				<form
					className="flex w-full flex-col gap-6 mt-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.AppField
						name="organizationName"
						children={(field) => (
							<field.TextField label="Organization Name" placeholder="My Event Company" />
						)}
					/>
					<form.AppField
						name="accountNumber"
						children={(field) => (
							<field.TextField
								label="Account Number"
								placeholder="1234567890"
								inputMode="numeric"
							/>
						)}
					/>
					<form.Field
						name="bankCode"
						children={(field) => (
							<Field
								name={field.name}
								invalid={!field.state.meta.isValid}
								dirty={field.state.meta.isDirty}
								touched={field.state.meta.isTouched}
							>
								<FieldLabel className={'font-medium'}>Bank</FieldLabel>
								<Combobox
									items={banks}
									itemToStringLabel={(item) => item.name}
									itemToStringValue={(item) => item.code}
									onValueChange={(val) => {
										field.handleChange(val?.code ?? null);
									}}
									value={banks.find((bank) => bank.code === field.state.value) || null}
								>
									<ComboboxInput
										aria-label="Select a bank"
										placeholder="Select a bank…"
										size="lg"
										showClear
									/>
									<ComboboxPopup>
										<ComboboxEmpty>No items found.</ComboboxEmpty>
										<ComboboxList>
											{(item) => (
												<ComboboxItem key={item.code} value={item}>
													{item.name}
												</ComboboxItem>
											)}
										</ComboboxList>
									</ComboboxPopup>
									<FieldError match={!field.state.meta.isValid}>
										{field.state.meta.errors[0]?.message}
									</FieldError>
								</Combobox>
							</Field>
						)}
					/>
					<form.Subscribe
						selector={(state) => [state.isSubmitting]}
						children={([isSubmitting]) => (
							<Button type="submit" disabled={isSubmitting} size="lg">
								{isSubmitting && <Spinner />}
								{isSubmitting ? 'Submitting...' : 'Submit'}
							</Button>
						)}
					/>
				</form>
			</div>
			{verifiedAccount && (
				<BankAccountConfirmation
					open={showConfirmation}
					onOpenChange={setShowConfirmation}
					accountName={verifiedAccount.accountName}
					accountNumber={verifiedAccount.accountNumber}
					bankName={verifiedAccount.bankName}
					onConfirm={handleConfirmAndCreate}
					isLoading={isCreating}
				/>
			)}
		</>
	);
}
