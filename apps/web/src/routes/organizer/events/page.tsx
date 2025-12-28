import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organizer/events/')({
	staticData: {
		title: 'Events',
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>This is the events page</div>;
}
