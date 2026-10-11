// ============================================
// Dashboard Layout Component
// Main layout wrapper with sidebar and topbar
// ============================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  FolderIcon,
  EyeIcon,
  ShieldCheckIcon,
  CreditCardIcon,
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
import { useLogout, useQuotaStatus } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/brand/logo';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { GSAP_EASE, RISE_PX, isReducedMotion } from '@/lib/motion';
import { VerifyEmailBanner } from './verify-banner';
import { LanguageToggle } from '@/components/language-toggle';
import { useT } from '@/lib/i18n';

gsap.registerPlugin(useGSAP);

const navItems = [
  { label: 'New scan', href: '/', icon: MagnifyingGlassIcon },
  { label: 'Scan history', href: '/history', icon: ClockIcon },
  { label: 'Investigations', href: '/investigation', icon: FolderIcon },
  { label: 'Watches', href: '/watches', icon: EyeIcon },
  { label: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { label: 'Billing', href: '/billing', icon: CreditCardIcon },
  { label: 'Account', href: '/profile', icon: UserCircleIcon },
];
const adminItem = { label: 'Admin', href: '/admin', icon: ShieldCheckIcon };


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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const t = useT();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
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
    return currentPath === href || (href !== '/' && currentPath.startsWith(href));
  };

  const { data: quota } = useQuotaStatus();
  const navRef = useRef<HTMLElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Nav marker slides to the active item; the page rises in once per navigation
  useGSAP(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const marker = markerRef.current;
    const reduced = isReducedMotion();
    if (marker) {
      if (active) {
        const to = { y: active.offsetTop, height: active.offsetHeight, autoAlpha: 1 };
        if (reduced) gsap.set(marker, to);
        else gsap.to(marker, { ...to, duration: 0.45, ease: GSAP_EASE });
      } else {
        gsap.set(marker, { autoAlpha: 0 });
      }
    }
    if (!reduced && pageRef.current) {
      gsap.fromTo(pageRef.current, { y: RISE_PX, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: GSAP_EASE });
    }
    mainRef.current?.scrollTo({ top: 0 });
  }, { dependencies: [currentPath, user?.id] });

  if (!user) {
    return <>{children}</>;
  }

  return (
    // Viewport-height shell: sidebar and headers stay put, only <main> scrolls
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden shrink-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-9 w-9">
          <Bars3Icon className="h-5 w-5" />
        </Button>
        <a href="#/" className="flex items-center gap-2 font-semibold">
          <Logo />
        </a>
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || 'User'} />
                  <AvatarFallback>{user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="#/profile" className="cursor-pointer">
                  <UserCircleIcon className="mr-2 h-4 w-4" />
                  Account
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                {t('Log out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-transform duration-300 w-64',
            'md:static md:h-full md:shrink-0 md:translate-x-0',
            // Closed state comes from CSS, so the sidebar never flashes open on first paint
            sidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-full'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-14 items-center border-b px-4">
            <a href="#/" className="flex items-center gap-2 font-semibold">
              <Logo size="lg" />
            </a>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="ml-auto h-9 w-9">
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav ref={navRef} className="relative flex-1 space-y-1 p-3 overflow-y-auto" aria-label="Main">
            <span
              ref={markerRef}
              aria-hidden
              className="pointer-events-none invisible absolute left-3 top-0 w-[3px] rounded-full bg-trace"
            />
            {(user.isSuperuser ? [...navItems, adminItem] : navItems).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={`#${item.href}`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg py-2.5 pl-5 pr-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-trace',
                    active
                      ? 'bg-sidebar-accent text-foreground font-semibold'
                      : 'text-muted-foreground font-medium hover:bg-sidebar-accent/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(item.label)}</span>
                </a>
              );
            })}
          </nav>

          {/* Daily quota */}
          {quota && quota.dailyLimit < 100000 && (
            <div className="mx-3 mb-3 rounded-lg border bg-background/60 px-3 py-2.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">{t('Scans left today')}</span>
                <span className="font-semibold">{t('{remaining} of {limit}', { remaining: quota.remaining, limit: quota.dailyLimit })}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500', quota.remaining === 0 ? 'bg-destructive' : 'bg-trace')}
                  style={{ width: `${(quota.remaining / quota.dailyLimit) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Sidebar Footer (Desktop Only) */}
          <div className="hidden md:flex border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || 'User'} />
                    <AvatarFallback>{user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{user?.fullName || user?.username}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <span>Account</span>
                    {user?.plan && <PlanBadge plan={user.plan} />}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="#/profile" className="cursor-pointer">
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    Account
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                  {t('Log out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto paper-grid">
          <SmoothScroll wrapper={mainRef} />
          {/* Single content child: Lenis scrolls this inside <main> */}
          <div className="min-h-full flex flex-col">
          {/* Desktop Header */}
          <header className="hidden md:flex sticky top-0 z-30 h-14 items-center gap-4 border-b bg-background/85 backdrop-blur px-8">
            <div className="flex-1" />
            <LanguageToggle />
            <ThemeToggle />
          </header>

          {/* Page Content */}
          <div ref={pageRef} className="flex-1 p-4 md:p-8">
            {user.emailVerified === false && <VerifyEmailBanner />}
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
