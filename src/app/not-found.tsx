import Link from 'next/link';
import { CubeIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <CubeIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-secondary-900">DropSpot</span>
          </div>
        </div>

        {/* 404 Content */}
        <div className="space-y-6">
          {/* 404 Number */}
          <div className="relative">
            <h1 className="text-9xl font-bold text-primary-500 opacity-20 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-primary-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-secondary-900">Page Not Found</h2>
            <p className="text-lg text-secondary-600 max-w-sm mx-auto">
              The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go Back Home
            </Link>
            
            <Link
              href="/drops"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-primary-600 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <CubeIcon className="h-5 w-5 mr-2" />
              Explore Drops
            </Link>
          </div>

          {/* Help Text */}
          <div className="pt-4">
            <p className="text-sm text-secondary-500">
              Need help? <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">Contact our support team</Link>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="relative pt-8">
          <div className="absolute inset-x-0 top-8">
            <div className="flex justify-center space-x-4">
              <div className="w-2 h-2 bg-primary-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}