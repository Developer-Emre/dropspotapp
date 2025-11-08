'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
  redirectIfUnauthenticated?: boolean;
}

/**
 * Component to handle authentication redirects
 * - Redirects authenticated users away from auth pages
 * - Redirects unauthenticated users to auth pages
 */
export default function AuthRedirect({
  children,
  redirectTo = '/',
  redirectIfAuthenticated = false,
  redirectIfUnauthenticated = false,
}: AuthRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'authenticated' && redirectIfAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (status === 'unauthenticated' && redirectIfUnauthenticated) {
      router.push(redirectTo);
      return;
    }
  }, [status, router, redirectTo, redirectIfAuthenticated, redirectIfUnauthenticated]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return <LoadingSpinner variant="fullscreen" text="Loading..." />;
  }

  // Don't render children if redirecting
  if (
    (status === 'authenticated' && redirectIfAuthenticated) ||
    (status === 'unauthenticated' && redirectIfUnauthenticated)
  ) {
    return null;
  }

  return <>{children}</>;
}