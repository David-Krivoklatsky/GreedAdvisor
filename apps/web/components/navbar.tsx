'use client';

import { Bell, Home, LogOut, Settings, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { TokenManager } from '@/lib/token-manager';
import { cn } from '@greed-advisor/utils';
import { useEffect, useState } from 'react';

interface NavbarProps {
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  } | null;
  onLogout?: () => void;
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar({ user, onLogout }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [fetchedUser, setFetchedUser] = useState<
    | { email?: string; firstName?: string; lastName?: string; profilePicture?: string }
    | null
    | undefined
  >(undefined);

  useEffect(() => {
    if (user !== undefined || !TokenManager.getAccessToken()) return;
    let cancelled = false;
    TokenManager.makeAuthenticatedRequest('/api/user/profile')
      .then(async response => {
        if (cancelled) return;
        if (!response.ok) {
          setFetchedUser(null);
          return;
        }
        const data = await response.json();
        if (!cancelled) setFetchedUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setFetchedUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const effectiveUser = user !== undefined ? user : fetchedUser;
  const displayName =
    [effectiveUser?.firstName, effectiveUser?.lastName].filter(Boolean).join(' ') ||
    (effectiveUser?.email ? effectiveUser.email.split('@')[0] : 'Guest');

  const initials =
    [effectiveUser?.firstName, effectiveUser?.lastName]
      .filter(Boolean)
      .map(p => (p as string)[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    effectiveUser?.email?.[0]?.toUpperCase() ||
    'U';

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await TokenManager.makeAuthenticatedRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    TokenManager.removeAccessToken();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/GA.png"
            alt="GreedAdvisor Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="hidden text-lg font-bold tracking-tight sm:block">GreedAdvisor</span>
        </Link>

        {/* Nav links */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname?.startsWith(link.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => router.push('/notifications')}
            aria-label="Notifications"
          >
            <Bell className="h-[1.2rem] w-[1.2rem]" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={effectiveUser?.profilePicture || '/profile-picture.svg'}
                    alt="Profile"
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {effectiveUser?.email || 'Not signed in'}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <UserIcon className="mr-2 h-4 w-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <Settings className="mr-2 h-4 w-4" /> Profile &amp; Keys
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
