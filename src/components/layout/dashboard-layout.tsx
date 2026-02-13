// ============================================
// Dashboard Layout Component
// Main layout wrapper with sidebar and topbar
// ============================================

'use client';

import { useState, useSyncExternalStore, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/error-boundary';

const navItems = [
  { label: 'New Scan', href: '#/', icon: MagnifyingGlassIcon },
  { label: 'Scan History', href: '#/history', icon: ClockIcon },
  { label: 'Reports', href: '#/reports', icon: DocumentTextIcon },
  { label: 'Profile', href: '#/profile', icon: UserCircleIcon },
];

// Custom hook for mounting detection without setState in effect
function useMounted() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary',
    enterprise: 'bg-gradient-to-r from-primary to-primary/60 text-primary-foreground',
  };

  return (
    <Badge variant="secondary" className={cn('text-xs font-medium', colors[plan as keyof typeof colors])}>
      {plan.toUpperCase()}
    </Badge>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogout();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [isMobile, setIsMobile] = useState(false);

  // Track hash changes for active link highlighting
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    updatePath();
    window.addEventListener('hashchange', updatePath);
    return () => window.removeEventListener('hashchange', updatePath);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.hash = '#/login';
  };

  const isActive = (href: string) => {
    // Remove the leading '#' from href for comparison
    const cleanHref = href.startsWith('#') ? href.substring(1) : href;
    return currentPath === cleanHref || (cleanHref !== '/' && currentPath.startsWith(cleanHref));
  };

  // Auth pages don't need dashboard layout
  if (currentPath === '/login' || currentPath === '/register') {
    return <>{children}</>;
  }

  // Not authenticated
  if (!user) { // Assuming user being null/undefined means not authenticated
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-9 w-9">
          <Bars3Icon className="h-5 w-5" />
        </Button>
        <a href="#/" className="flex items-center gap-2 font-semibold">
          <ShieldCheckIcon className="h-6 w-6 text-primary" />
          <span>OSIG</span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || ''} />
                  <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName || user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="#/profile">
                  <UserCircleIcon className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300',
            'md:relative md:translate-x-0',
            sidebarOpen ? 'w-64' : 'w-64', // This line seems to imply sidebarOpen means it's open, but the class logic below for mobile suggests it's for collapsed state. Let's assume sidebarOpen means it's open.
            isMobile && sidebarOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : ''
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-14 items-center border-b px-4">
            <a href="#/" className="flex items-center gap-2 font-semibold">
              <ShieldCheckIcon className="h-6 w-6 text-primary" />
              <span className="text-lg">OSIG</span>
            </a>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="ml-auto h-9 w-9">
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
          );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              OSIG uses only public and legally accessible information.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && sidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-4">
            {user && <PlanBadge plan={user.plan} />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 rounded-full gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatarUrl || ''} />
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
    </div >
  );
}
