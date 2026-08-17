import { ReactNode } from 'react';
import Navbar from '../navbar';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({
  children,
  className = 'min-h-screen bg-background',
}: PageLayoutProps) {
  return (
    <div className={className}>
      <Navbar />
      {children}
    </div>
  );
}
