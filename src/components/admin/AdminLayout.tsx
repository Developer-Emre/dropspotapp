'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  CubeIcon, 
  HomeIcon,
  PlusIcon,
  QueueListIcon,
  ExclamationTriangleIcon,
  ArrowLeftOnRectangleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAdminStore } from '@/store/adminStore';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: HomeIcon,
    current: false 
  },
  { 
    name: 'Drops', 
    href: '/admin/drops', 
    icon: CubeIcon,
    current: false 
  },
  { 
    name: 'Create Drop', 
    href: '/admin/drops/create', 
    icon: PlusIcon,
    current: false 
  },
  { 
    name: 'Waitlists', 
    href: '/admin/waitlist', 
    icon: QueueListIcon,
    current: false 
  },
];

const mainNavigation = [
  { 
    name: 'Back to DropSpot', 
    href: '/', 
    icon: GlobeAltIcon,
    current: false 
  },
  { 
    name: 'Sign Out', 
    href: '#', 
    icon: ArrowLeftOnRectangleIcon,
    current: false,
    isAction: true
  },
];

function AdminSidebar({ currentPath }: { currentPath: string }) {
  const navigationWithCurrent = navigation.map(item => ({
    ...item,
    current: currentPath === item.href || 
             (item.href !== '/admin' && currentPath.startsWith(item.href))
  }));

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col flex-shrink-0 px-4 py-4 bg-gray-900">
          <div className="flex items-center mb-3">
            <CubeIcon className="h-8 w-8 text-indigo-400" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white">DropSpot</h1>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                  Admin
                </span>
                <span className="ml-2 text-xs text-gray-400">Console</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Admin Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationWithCurrent.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  ${item.current
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                `}
              >
                <item.icon
                  className={`
                    ${item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'}
                    mr-3 flex-shrink-0 h-6 w-6
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Quick Actions */}
          <div className="px-2 py-4 border-t border-gray-700">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Quick Actions
            </div>
            {mainNavigation.map((item) => (
              item.isAction ? (
                <button
                  key={item.name}
                  onClick={handleSignOut}
                  className="text-gray-300 hover:bg-red-600 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-150"
                >
                  <item.icon
                    className="text-gray-400 group-hover:text-white mr-3 flex-shrink-0 h-5 w-5"
                    aria-hidden="true"
                  />
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:bg-indigo-600 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150"
                >
                  <item.icon
                    className="text-gray-400 group-hover:text-white mr-3 flex-shrink-0 h-5 w-5"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStats() {
  const { stats, loadStats } = useAdminStore();
  const hasLoadedStats = useRef(false);

  useEffect(() => {
    if (!hasLoadedStats.current) {
      loadStats();
      hasLoadedStats.current = true;
    }
  }, []);

  if (!stats) {
    return (
      <div className="mt-6">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Dashboard Stats
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statsData = [
    {
      name: 'Total Drops',
      stat: stats.totalDrops.toLocaleString(),
      icon: CubeIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      name: 'Active Drops',
      stat: stats.activeDrops.toLocaleString(),
      icon: CubeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total Claims',
      stat: stats.totalClaims.toLocaleString(),
      icon: QueueListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Conversion Rate',
      stat: `${(stats.conversionRate * 100).toFixed(1)}%`,
      icon: ExclamationTriangleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statsData.map((item) => (
        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md ${item.bgColor}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {item.stat}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnauthorizedAccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Access Denied
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don't have administrator privileges to access this page.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Not admin (assuming we add role to session)
  // For now, we'll check if user has admin privileges
  // This should be implemented based on your auth setup
  if (session?.user && (!(session.user as any)?.role || (session.user as any)?.role !== 'ADMIN')) {
    // For development, we'll allow access. In production, uncomment below:
    // return <UnauthorizedAccess />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AdminSidebar currentPath={pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <AdminSidebar currentPath={pathname} />
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Admin Header with mobile menu button */}
        <div className="flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-lg font-semibold text-gray-900">
                {pathname === '/admin' && 'Dashboard'}
                {pathname.startsWith('/admin/drops') && !pathname.includes('/create') && !pathname.includes('/edit') && 'Drops Management'}
                {pathname.includes('/admin/drops/create') && 'Create New Drop'}
                {pathname.includes('/admin/drops') && pathname.includes('/edit') && 'Edit Drop'}
                {pathname.startsWith('/admin/waitlist') && 'Waitlist Management'}
              </h1>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats on dashboard */}
              {pathname === '/admin' && <AdminStats />}
              
              {/* Page content */}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}