// ============================================
// SIGNIN PAGE
// ============================================

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSignIn } from '@/hooks/useSignIn'
import { getFieldError, hasFieldError } from '@/lib/validators'
import Button from '@/components/ui/Button'
import { AuthErrorBoundary } from '@/components/ErrorBoundary'
import type { SignInFormData } from '@/types/auth'

// ============================================
// COMPONENT
// ============================================

export default function SignInPage() {
  const searchParams = useSearchParams()
  const { signInUser, isLoading, errors, apiError, clearErrors, clearApiError } = useSignIn()

  // Form state
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: ''
  })

  // Get initial message from URL params (e.g., success from registration)
  const initialMessage = searchParams?.get('message')

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await signInUser(formData)
  }, [signInUser, formData])

  /**
   * Handle input changes with error clearing
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear field-specific validation error when user starts typing
    if (hasFieldError(errors, name as keyof SignInFormData)) {
      clearErrors()
    }

    // Clear API error when user makes changes
    if (apiError) {
      clearApiError()
    }
  }, [errors, apiError, clearErrors, clearApiError])

  /**
   * Get CSS classes for input field based on error state
   */
  const getInputClasses = useCallback((fieldName: keyof SignInFormData): string => {
    const baseClasses = 'w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
    const hasError = hasFieldError(errors, fieldName)
    
    return `${baseClasses} ${
      hasError 
        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
        : 'border-gray-300 bg-white/50 hover:border-gray-400'
    }`
  }, [errors])

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12 pt-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-2xl font-bold text-secondary-900">DropSpot</span>
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Welcome Back</h1>
            <p className="text-secondary-600">Sign in to your account and discover amazing drops</p>
          </div>

        {/* Sign In Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          {/* Success Message */}
          {initialMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{decodeURIComponent(initialMessage)}</p>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={getInputClasses('email')}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {getFieldError(errors, 'email') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'email')}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={getInputClasses('password')}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {getFieldError(errors, 'password') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'password')}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Don't have an account?{' '}
              <Link 
                href="/auth/register" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-secondary-500 hover:text-primary-600 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-secondary-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
    </AuthErrorBoundary>
  )
}