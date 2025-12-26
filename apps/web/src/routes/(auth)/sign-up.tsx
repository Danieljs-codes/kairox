import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@ui/button';
import { AuthPageLayout } from '@/components/auth-page-layout';
import { useAppForm } from '@/components/form-factory';
import { signUpSchema, type SignUpOutput } from '@kairox/schema/auth';
import { revalidateLogic, useStore } from '@tanstack/react-form';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import { authClient } from '@/lib/auth-client';
import { toastManager } from '@ui/toast';
import { Alert, AlertTitle } from '@ui/alert';
import IconTriangleWarning from '@icons/triangle-warning.svg';
import { Spinner } from '@ui/spinner';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)/sign-up')({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const form = useAppForm({
		defaultValues: {
			name: '',
			email: '',
			password: '',
		} as SignUpOutput,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: signUpSchema,
			onSubmitAsync: async ({ value }) => {
				const { data, error } = await authClient.signUp.email({
					name: value.name,
					email: value.email,
					password: value.password,
				});

				if (error) {
					return { form: error.message };
				}

				toastManager.add({
					type: 'success',
					title: 'Welcome to Kairox!',
					description: `Account created for ${data.user.name}. You're all set!`,
				});
				navigate({ to: '/' });
			},
		},
	});

	const formError = useStore(form.store, (state) => state.errorMap.onSubmit?.form);

	return (
		<AuthPageLayout
			title="Join our community and create your account"
			description={
				<>
					Already have an account?{' '}
					<Button
						variant="link"
						size="xs"
						className="px-0 size-auto text-primary text-sm!"
						render={<Link to="/sign-in">Sign in to your account</Link>}
					/>
				</>
			}
		>
			<form
				className="flex w-full flex-col gap-6 mt-2"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
			>
				{formError && (
					<Alert variant="error">
						<IconTriangleWarning />
						<AlertTitle className="text-destructive-foreground">{formError}</AlertTitle>
					</Alert>
				)}
				<form.AppField
					name="name"
					children={(field) => <field.TextField label="Full Name" placeholder="Chioma Okonkwo" />}
				/>
				<form.AppField
					name="email"
					children={(field) => (
						<field.TextField label="Email Address" type="email" placeholder="you@example.com" />
					)}
				/>
				<form.AppField
					name="password"
					children={(field) => (
						<field.TextField label="Password" type="password" placeholder="••••••••" />
					)}
				/>
				<form.Subscribe
					selector={(state) => [state.isSubmitting]}
					children={([isSubmitting]) => (
						<Button type="submit" disabled={isSubmitting} size="lg">
							{isSubmitting && <Spinner />}
							{isSubmitting ? 'Signing Up...' : 'Sign Up'}
						</Button>
					)}
				/>
			</form>
			<SocialAuthButtons />
		</AuthPageLayout>
	);
}
