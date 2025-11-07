// ============================================
// ADMIN AUTH GUARD COMPONENT
// ============================================

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      // Not authenticated, redirect to sign in
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }

    if (session && (session.user as any)?.role !== 'ADMIN') {
      // Authenticated but not admin, redirect to home
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting non-admin users
  if (session && (session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin
  return <>{children}</>;
}