import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { ExclamationTriangleIcon, HomeIcon, CubeIcon } from '@heroicons/react/24/outline';

export default function AdminNotFound() {
  return (
    <AdminAuthGuard>
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-6 max-w-md">
            {/* 404 Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Admin Page Not Found</h1>
              <p className="text-lg text-gray-600">
                The admin page you're looking for doesn't exist or you don't have permission to access it.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              
              <Link
                href="/admin/drops"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <CubeIcon className="h-5 w-5 mr-2" />
                Manage Drops
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}