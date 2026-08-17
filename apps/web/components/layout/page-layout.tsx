import { ReactNode } from 'react';
import Navbar from '../navbar';

interface PageLayoutProps {
  children: ReactNode;
  hasNewNotifications?: boolean;
  className?: string;
}

export default function PageLayout({
  children,
  hasNewNotifications = false,
  className = 'min-h-screen bg-background',
}: PageLayoutProps) {
  return (
    <div className={className}>
      <Navbar hasNewNotifications={hasNewNotifications} />
      {children}
    </div>
  );
}
