import { AppSidebar } from '@/components/organizer/app-sidebar';
import { getSidebarState, setFlashCookie } from '@/lib/cookie';
import IconSquarePlus from '@icons/square-plus.svg';
import { createFileRoute, Link, Outlet, redirect, useChildMatches } from '@tanstack/react-router';
import { Button } from '@ui/button';
import { Separator } from '@ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@ui/sidebar';
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '@ui/tooltip';
import { uuidv7 } from 'uuidv7';

export const Route = createFileRoute('/organizer')({
	beforeLoad: async ({ context }) => {
		const profile = await context.queryClient.fetchQuery(
			context.orpc.organizer.getCurrentOrganizerProfile.queryOptions(),
		);

		if (!profile.session) {
			setFlashCookie({
				title: 'Sign in required',
				description: 'Please sign in to access organizer dashboard',
				type: 'info',
			});
			throw redirect({
				to: '/sign-in',
			});
		}

		if (!profile.organizer) {
			setFlashCookie({
				title: 'Organizer profile required',
				description: 'Please create an organizer profile to access this page',
				type: 'info',
			});
			throw redirect({
				to: '/become-organizer',
			});
		}

		return { profile };
	},
	loader: ({ context }) => {
		const sidebarState = getSidebarState();
		return { sidebarState };
	},
	component: RouteComponent,
});

function SidebarTriggerWithTooltip() {
	const { state } = useSidebar();
	return (
		<TooltipProvider delay={0}>
			<Tooltip>
				<SidebarTrigger className="-ml-1" render={<TooltipTrigger />} />
				<TooltipPopup className="font-medium" side="inline-end">
					{state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
				</TooltipPopup>
			</Tooltip>
		</TooltipProvider>
	);
}

function RouteComponent() {
	const { profile } = Route.useRouteContext();
	const { sidebarState } = Route.useLoaderData();

	const matches = useChildMatches();
	const currentRoute = matches.at(-1);
	// For route with static title we can store the title in the staticData
	//  and for route with dynamic title we would fetch and return the title in the loader
	const routeTitle =
		(currentRoute?.staticData as { title?: string } | undefined)?.title ||
		(currentRoute?.loaderData as { title?: string } | undefined)?.title;

	return (
		<SidebarProvider defaultOpen={sidebarState}>
			<TooltipProvider delay={200}>
				<AppSidebar email={profile.session.user.email} organizationName={profile.organizer.name} />
				<SidebarInset>
					<header className="flex h-14 items-center justify-between border-b px-4">
						<div className="flex shrink-0 items-center gap-2">
							<SidebarTriggerWithTooltip />
							{routeTitle && (
								<>
									<Separator className="mr-2 h-6" orientation="vertical" />
									<h2 className="font-semibold text-base leading-tight">{routeTitle}</h2>
								</>
							)}
						</div>
						<Button
							className="text-sm"
							render={
								<Link
									params={{
										id: uuidv7(),
									}}
									to="/organizer/events/$id/create-event"
								/>
							}
							size="default"
						>
							<IconSquarePlus />
							Create Event
						</Button>
					</header>
					<div className="p-(--main-padding) [--main-padding:calc(var(--spacing)*4)]">
						<Outlet />
					</div>
				</SidebarInset>
			</TooltipProvider>
		</SidebarProvider>
	);
}
