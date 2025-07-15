import { ReactNode } from 'react';
import Navbar from '../navbar';

interface PageLayoutProps {
  children: ReactNode;
  hasNewNotifications?: boolean;
  className?: string;
  logoPosition?: 'default' | 'sidebar';
}

export default function PageLayout({
  children,
  hasNewNotifications = false,
  className = 'min-h-screen bg-gray-50',
  logoPosition = 'default',
}: PageLayoutProps) {
  return (
    <div className={className}>
      <Navbar hasNewNotifications={hasNewNotifications} logoPosition={logoPosition} />
      {children}
    </div>
  );
}
