import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/organizer')({
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
	return (
		<div>
			<Outlet />
		</div>
	);
}
