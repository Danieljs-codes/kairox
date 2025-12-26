import { Link } from '@tanstack/react-router';
import { Logo } from '@/components/logo';

interface AuthPageLayoutProps {
	title: string;
	description?: React.ReactNode;
	children: React.ReactNode;
	showHomeButton?: boolean;
	showLogo?: boolean;
}

export function AuthPageLayout({
	title,
	description,
	children,
	showLogo = true,
}: AuthPageLayoutProps) {
	return (
		<div>
			<div className="mx-auto w-full flex flex-col gap-y-4 sm:w-sm">
				{showLogo && (
					<Link to="/" className="inline-block mb-4">
						<Logo
							classNames={{
								container: 'sm:hidden',
								icon: 'size-6 text-primary',
							}}
						/>
					</Link>
				)}
				<div className="flex flex-col gap-y-1 mb-2">
					<h1 className="text-2xl font-semibold tracking-tight leading-[1.2]">{title}</h1>
					{description && <p className="text-sm text-muted-foreground">{description}</p>}
				</div>
				{children}
			</div>
		</div>
	);
}
