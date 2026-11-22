import {
  getRouteApi,
  Link,
  Outlet,
  useMatchRoute,
} from '@tanstack/react-router';
import {
  Building2,
  Download,
  House,
  type LucideIcon,
  MapIcon,
  Radio,
  Settings,
  TriangleAlert,
  UsersIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavUser } from '@/features/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Wordmark } from '@/components/wordmark';
import { useRealtimeConnection } from '@/features/realtime';

const route = getRouteApi('/dashboard/_app');

type NavItem = {
  to:
    | '/dashboard'
    | '/dashboard/incidents'
    | '/dashboard/map'
    | '/dashboard/residents'
    | '/dashboard/broadcasts'
    | '/dashboard/export'
    | '/dashboard/admin/users'
    | '/dashboard/admin/incident-types'
    | '/dashboard/admin/agencies';
  label: string;
  icon: LucideIcon;
  /** Keeps the item active on its child pages; Home must match exactly. */
  fuzzy: boolean;
};

// Help & Docs sits in the user menu, not here.
const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: House, fuzzy: false },
  {
    to: '/dashboard/incidents',
    label: 'Incidents',
    icon: TriangleAlert,
    fuzzy: true,
  },
  { to: '/dashboard/map', label: 'Map', icon: MapIcon, fuzzy: false },
  {
    to: '/dashboard/residents',
    label: 'Residents',
    icon: UsersIcon,
    fuzzy: true,
  },
  {
    to: '/dashboard/broadcasts',
    label: 'Broadcasts',
    icon: Radio,
    fuzzy: true,
  },
  { to: '/dashboard/export', label: 'Export', icon: Download, fuzzy: false },
];

const adminNavItems: NavItem[] = [
  {
    to: '/dashboard/admin/users',
    label: 'Users',
    icon: UsersIcon,
    fuzzy: false,
  },
  {
    to: '/dashboard/admin/incident-types',
    label: 'Incident types',
    icon: Settings,
    fuzzy: false,
  },
  {
    to: '/dashboard/admin/agencies',
    label: 'Agencies',
    icon: Building2,
    fuzzy: false,
  },
];

function NavGroup({ label, items }: { label?: string; items: NavItem[] }) {
  const matchRoute = useMatchRoute();
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                render={<Link to={item.to} />}
                isActive={!!matchRoute({ to: item.to, fuzzy: item.fuzzy })}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardLayout() {
  const { session } = route.useRouteContext();
  useRealtimeConnection();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
                  <Wordmark
                    className="text-2xl"
                    textClassName="group-data-[collapsible=icon]:hidden"
                    logoClassName="group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:size-8!"
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <NavGroup items={navItems} />
            {session.user.role === 'admin' && (
              <NavGroup label="Admin" items={adminNavItems} />
            )}
          </SidebarContent>
          <SidebarFooter>
            <NavUser
              user={{
                name: session.user.name,
                email: session.user.email,
                avatar: session.user.image ?? undefined,
              }}
            />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
