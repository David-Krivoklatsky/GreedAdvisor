import { ThemeToggle } from '@/components/theme/theme-toggle';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/GA.png"
            alt="GreedAdvisor Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-lg font-bold">GreedAdvisor</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Center card */}
      <div className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 text-center">
              <Image
                src="/GA.png"
                alt="GreedAdvisor Logo"
                width={64}
                height={64}
                className="mx-auto rounded-2xl"
              />
              <h2 className="mt-4 text-2xl font-bold">{title}</h2>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
