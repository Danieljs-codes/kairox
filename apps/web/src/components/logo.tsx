import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

function LogoIcon({ className, ...props }: ComponentProps<'svg'>) {
	return (
		<svg
			className={className}
			fill="none"
			height="48"
			viewBox="0 0 38 48"
			width="38"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>Myrren Logo</title>
			<path
				d="m14.25 5c0 7.8701-6.37994 14.25-14.25 14.25v9.5h14.25v14.25h9.5c0-7.8701 6.3799-14.25 14.25-14.25v-9.5h-14.25v-14.25z"
				fill="currentColor"
			/>
		</svg>
	);
}

type LogoProps = {
	iconOnly?: boolean;
	classNames?: {
		container?: string;
		icon?: string;
		text?: string;
	};
} & Omit<ComponentProps<'svg'>, 'className'>;

function Logo({ iconOnly = false, classNames, ...props }: LogoProps) {
	return (
		<div className={cn('flex items-center gap-x-1', classNames?.container)}>
			<LogoIcon className={cn('size-6 h-[48px] w-[38px]', classNames?.icon)} {...props} />
			{!iconOnly && (
				<p className={cn('select-none font-semibold text-base text-foreground', classNames?.text)}>
					Myrren
				</p>
			)}
		</div>
	);
}

export { Logo };
