'use client';

import { Bell, Home } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface NavbarProps {
  logoPosition?: 'default' | 'over-sidebar';
  profileRedirectTo?: string;
  hasNewNotifications?: boolean;
}

export default function Navbar({
  logoPosition = 'default',
  profileRedirectTo = '/profile',
  hasNewNotifications = false,
}: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="bg-white shadow relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center">
          {/* Left side - Logo */}
          <div
            className={`flex items-center w-60 ${logoPosition === 'default' ? '' : 'invisible'}`}
          >
            <Image src="/greedadvisor.png" alt="GreedAdvisor Logo" width={220} height={220} />
          </div>

          {/* Centered Navigation Links - positioned absolutely to ensure perfect centering */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
            <NavigationMenu className="relative">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="left-0 w-[400px] data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-start]:slide-out-to-left-52">
                    <ul className="grid gap-3 p-6 w-[400px] grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/dashboard"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">GreedAdvisor</div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Manage your AI and Trading API keys securely.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/dashboard" title="Dashboard">
                        View your portfolio and market data
                      </ListItem>
                      <ListItem href="/profile" title="Profile">
                        Manage your API keys and account settings
                      </ListItem>
                      <ListItem href="/" title="About">
                        Learn more about GreedAdvisor
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu className="relative">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>GitHub</NavigationMenuTrigger>
                  <NavigationMenuContent className="left-0 w-[300px] data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-start]:slide-out-to-left-52">
                    <ul className="grid gap-3 p-4 w-[300px]">
                      <ListItem
                        href="https://github.com/David-Krivoklatsky/GreedAdvisor"
                        title="GreedAdvisor Repository"
                      >
                        View the source code and contribute
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu className="relative">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>T212</NavigationMenuTrigger>
                  <NavigationMenuContent className="left-0 w-[300px] data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-start]:slide-out-to-left-52">
                    <ul className="grid gap-3 p-4 w-[300px]">
                      <ListItem href="https://trading212.com" title="Trading212 Platform">
                        Access your Trading212 account
                      </ListItem>
                      <ListItem
                        href="https://t212public-api-docs.redoc.ly/"
                        title="API Documentation"
                      >
                        View Trading212 API documentation
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/notifications')}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {hasNewNotifications && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></span>
                )}
              </Button>
            </div>

            {/* Profile Picture */}
            <Image
              src="/profile-picture.svg"
              alt="Profile Picture"
              width={40}
              height={40}
              className="rounded-full cursor-pointer"
              onClick={() => router.push(profileRedirectTo)}
            />
          </div>
        </div>
      </div>

      {/* Logo positioned over sidebar center - now adjusted for w-96 (384px) sidebar */}
      {logoPosition === 'over-sidebar' && (
        <div className="absolute top-4 left-48 transform -translate-x-1/2 z-10">
          <Image src="/greedadvisor.png" alt="GreedAdvisor Logo" width={220} height={220} />
        </div>
      )}
    </nav>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  const isExternal = href.startsWith('http');

  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
