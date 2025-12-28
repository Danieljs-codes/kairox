import { FloatingPaths } from '@/components/floating-paths';
import { Logo } from '@/components/logo';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
				<Link to="/" className="z-10 w-fit">
					<Logo
						classNames={{
							icon: 'size-5 text-primary',
						}}
					/>
				</Link>
				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-xl font-medium">
							&ldquo;Managing events has never been easier. From registrations to real-time
							analytics, this platform handles everything seamlessly.&rdquo;
						</p>
						<footer className="font-semibold text-sm">
							&mdash; Sarah Martinez, Event Director
						</footer>
					</blockquote>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>
			<div className="relative flex min-h-svh flex-col justify-center p-4">
				<Outlet />
			</div>
		</main>
	);
}
