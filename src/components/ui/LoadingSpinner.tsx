import { CubeIcon } from '@heroicons/react/24/outline';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'spinner' | 'pulse' | 'dots' | 'fullscreen';
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  variant = 'spinner',
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // Full-screen loading variant
  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center space-y-8">
          {/* Animated Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center animate-pulse">
                <CubeIcon className="h-8 w-8 text-white" />
              </div>
              {/* Rotating Ring */}
              <div className="absolute -inset-2">
                <div className="w-20 h-20 border-2 border-primary-300 rounded-xl animate-spin border-t-primary-600"></div>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-secondary-900">Loading DropSpot</h2>
            <p className="text-secondary-600 max-w-sm mx-auto">
              {text || 'Preparing your amazing drop experience...'}
            </p>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce delay-200"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 mx-auto">
            <div className="w-full bg-primary-200 rounded-full h-1">
              <div className="bg-primary-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        <div className={`bg-primary-500 rounded-full animate-bounce ${sizeClasses[size]}`}></div>
        <div className={`bg-primary-500 rounded-full animate-bounce delay-100 ${sizeClasses[size]}`}></div>
        <div className={`bg-primary-500 rounded-full animate-bounce delay-200 ${sizeClasses[size]}`}></div>
        {text && <span className="ml-2 text-gray-600 text-sm">{text}</span>}
      </div>
    );
  }

  // Pulse variant
  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`bg-primary-500 rounded-full animate-pulse ${sizeClasses[size]}`}></div>
        {text && <span className="ml-2 text-gray-600 text-sm">{text}</span>}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}></div>
      {text && <span className="ml-2 text-gray-600 text-sm">{text}</span>}
    </div>
  );
}