'use client';

import { useEffect, useRef } from 'react';
import { useAdminStore } from '@/store/adminStore';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  ChartBarIcon, 
  CubeIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { 
    drops, 
    stats, 
    isLoading, 
    error, 
    loadDrops, 
    loadStats 
  } = useAdminStore();
  
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      loadDrops();
      loadStats();
      hasLoaded.current = true;
    }
  }, []);

  if (error) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  const recentDrops = drops.slice(0, 5);

  const quickActions = [
    {
      name: 'Create New Drop',
      href: '/admin/drops/create',
      description: 'Launch a new limited edition drop',
      icon: CubeIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'View All Drops',
      href: '/admin/drops',
      description: 'Manage existing drops',
      icon: ChartBarIcon,
      color: 'bg-green-500'
    }
  ];

  return (
    <AdminAuthGuard>
      <AdminLayout>
        <div className="space-y-6">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your DropSpot platform
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <a
              href="/admin/drops/create"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Drop
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <a
                  key={action.name}
                  href={action.href}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-3 ring-4 ring-white ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {action.name}
                    </h4>
                    <p className="mt-2 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Drops */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Drops
                  </h3>
                  <a
                    href="/admin/drops"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View all
                  </a>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : recentDrops.length === 0 ? (
                  <div className="text-center py-8">
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No drops</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new drop.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/admin/drops/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Create Drop
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDrops.map((drop) => (
                      <div
                        key={drop.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {drop.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {drop.description}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-400">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {new Date(drop.startDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            drop.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            drop.status === 'waitlist' ? 'bg-yellow-100 text-yellow-800' :
                            drop.status === 'claiming' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {drop.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  System Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">API Status</p>
                      <p className="text-xs text-green-600">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">Database</p>
                      <p className="text-xs text-green-600">Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">Background Jobs</p>
                      <p className="text-xs text-green-600">Running</p>
                    </div>
                  </div>
                </div>

                {stats && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Today's Activity
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">New Users</span>
                        <span className="text-gray-900">--</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Claims Made</span>
                        <span className="text-gray-900">--</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Drops Created</span>
                        <span className="text-gray-900">--</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </AdminAuthGuard>
  );
}