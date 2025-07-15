import Image from 'next/image';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image
            src="/greedadvisor.png"
            alt="GreedAdvisor Logo"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold" style={{ color: '#1F09FF' }}>
            {title}
          </h2>
          {subtitle && (
            <p
              className="mt-2 text-sm text-gray-600"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
