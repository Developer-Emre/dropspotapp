'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

interface ConditionalNavigationProps {
  children?: React.ReactNode;
}

export default function ConditionalNavigation({ children }: ConditionalNavigationProps) {
  const pathname = usePathname();
  
  // Don't show main navigation for admin pages
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}