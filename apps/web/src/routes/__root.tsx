import type { QueryClient } from '@tanstack/react-query';
import { AnchoredToastProvider, ToastProvider } from '@ui/toast';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { FormDevtoolsPanel } from '@tanstack/react-form-devtools';
import { HeadContent, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ThemeProvider } from '@/components/theme-provider';
import { orpc } from '@/lib/orpc';
import styles from '../styles/index.css?url';

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
			},
			{
				title: 'Kairox — Event ticketing platform for Nigeria',
			},
		],
		links: [
			{ rel: 'stylesheet', href: styles },
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '96x96',
				href: '/favicon-96x96.png',
			},
			{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
			{ rel: 'shortcut icon', href: '/favicon.ico' },
			{
				rel: 'apple-touch-icon',
				sizes: '180x180',
				href: '/apple-touch-icon.png',
			},
			{ rel: 'manifest', href: '/site.webmanifest' },
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider attribute="class" disableTransitionOnChange storageKey="vite-ui-theme">
				<ToastProvider>
					<AnchoredToastProvider>
						<div className="grid grid-rows-[auto_1fr] h-svh">
							<Outlet />
						</div>
					</AnchoredToastProvider>
				</ToastProvider>
			</ThemeProvider>
			<TanStackDevtools
				config={{ openHotkey: ['CtrlOrMeta', 'Shift', 'd'] }}
				plugins={[
					{
						name: 'TanStack Query',
						render: <ReactQueryDevtoolsPanel />,
					},
					{
						name: 'TanStack Router',
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: 'TanStack Form',
						render: <FormDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}
