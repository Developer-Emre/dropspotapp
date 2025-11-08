'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">Something went wrong!</h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              We're sorry, but something unexpected happened. This error has been logged and we're working to fix it.
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 text-left">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Error Details:</h3>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {error.message}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go Back Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              If this problem persists, please <Link href="/contact" className="text-red-600 hover:text-red-700 font-medium">contact our support team</Link>
            </p>
          </div>
        </div>

        {/* Error Code */}
        {error.digest && (
          <div className="pt-4">
            <p className="text-xs text-gray-400">
              Error Code: {error.digest}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}