import { Logo } from '@/components/logo';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import IconArrowDoorOut from '@icons/arrow-door-out.svg';
import IconCalendarDays from '@icons/calendar-days.svg';
import IconChevronExpandY from '@icons/chevron-expand-y.svg';
import IconDashboard from '@icons/dashboard.svg';
import IconGear from '@icons/gear.svg';
import IconTicket from '@icons/ticket.svg';
import IconUser from '@icons/user.svg';
import IconVaultFill from '@icons/vault-fill.svg';
import { Link, type LinkOptions, linkOptions } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar';
import {
	Menu,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuTrigger,
} from '@ui/menu';
import { useTheme } from 'next-themes';
import { type ComponentProps, type ComponentType, type SVGProps, useState } from 'react';
type Routes = {
	title: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	linkOption: LinkOptions;
};

const navItems = [
	{
		title: 'Dashboard',
		icon: IconDashboard,
		linkOption: linkOptions({
			to: '/organizer/dashboard',
		}),
	},
	{
		title: 'Events',
		icon: IconCalendarDays,
		// @ts-expect-error - Routes still need to be created
		linkOption: linkOptions({
			to: '/organizer/events',
		}),
	},
	{
		title: 'Tickets',
		icon: IconTicket,
		// @ts-expect-error - Routes still need to be created
		linkOption: linkOptions({
			to: '/organizer/tickets',
		}),
	},
	{
		title: 'Attendees',
		icon: IconUser,
		// @ts-expect-error - Routes still need to be created
		linkOption: linkOptions({
			to: '/organizer/attendees',
		}),
	},
	{
		title: 'Finances',
		icon: IconVaultFill,
		// @ts-expect-error - Routes still need to be created
		linkOption: linkOptions({
			to: '/organizer/finances',
		}),
	},
	{
		title: 'Settings',
		// @ts-expect-error - Routes still need to be created
		linkOption: linkOptions({
			to: '/organizer/settings',
		}),
		icon: IconGear,
	},
] satisfies Routes[];

const upcomingEvents = [
	{
		title: 'Summer Fest 2024',
		date: 'June 15, 2024',
		icon: IconCalendarDays,
	},
	{
		title: 'Tech Conference 2024',
		date: 'July 20, 2024',
		icon: IconCalendarDays,
	},
];

export function AppSidebar({
	email,
	organizationName,
	...props
}: ComponentProps<typeof Sidebar> & {
	organizationName: string;
	email: string;
}) {
	const { theme, setTheme } = useTheme();
	const [menuOpen, setMenuOpen] = useState(false);
	const { isMobile, state, setOpenMobile } = useSidebar();
	const iconOnly = state === 'collapsed' && !isMobile;
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center justify-start gap-2 px-2 py-2">
					<Logo
						classNames={{
							container: cn(state === 'expanded' || (isMobile && 'px-2')),
							icon: 'size-5 text-primary',
						}}
						iconOnly={iconOnly}
					/>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Overview</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={
											<Link
												activeProps={{
													'data-active': 'true',
												}}
												{...item.linkOption}
												onClick={() => {
													if (isMobile) {
														setOpenMobile(false);
													}
												}}
											/>
										}
										tooltip={item.title}
									>
										<item.icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Upcoming Events</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{upcomingEvents.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={
											<Link
												activeProps={{
													'data-active': 'true',
												}}
												className="font-medium"
												to={item.title}
											/>
										}
										tooltip={item.title}
									>
										<item.icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<Menu onOpenChange={setMenuOpen} open={menuOpen}>
						<MenuTrigger
							openOnHover
							render={
								<SidebarMenuButton
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									isActive={menuOpen}
									size="lg"
								>
									<Avatar className="h-8 w-8 rounded-lg grayscale">
										<AvatarImage alt={organizationName} src="" />
										<AvatarFallback className="rounded-lg uppercase">
											{organizationName[0]}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium capitalize">
											{organizationName.toLowerCase()}
										</span>
										<span className="truncate text-muted-foreground text-xs">{email}</span>
									</div>
									<IconChevronExpandY className="ml-auto size-4" />
								</SidebarMenuButton>
							}
						/>
						<MenuPopup className="w-(--anchor-width) min-w-40!">
							<MenuItem>
								<IconUser />
								Profile
							</MenuItem>
							<MenuSeparator />
							<MenuGroup>
								<MenuGroupLabel>Themes</MenuGroupLabel>
								<MenuRadioGroup onValueChange={(value) => setTheme(value)} value={theme}>
									<MenuRadioItem value="light">Light</MenuRadioItem>
									<MenuRadioItem value="dark">Dark</MenuRadioItem>
									<MenuRadioItem value="system">System</MenuRadioItem>
								</MenuRadioGroup>
							</MenuGroup>
							<MenuSeparator />
							<MenuItem variant="destructive">
								<IconArrowDoorOut />
								Sign out
							</MenuItem>
						</MenuPopup>
					</Menu>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
