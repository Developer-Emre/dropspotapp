// ============================================
// REGISTER PAGE
// ============================================

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRegister } from '@/hooks/useRegister'
import { getFieldError, hasFieldError } from '@/lib/validators'
import Button from '@/components/ui/Button'
import { useErrorToast } from '@/providers/ErrorToastProvider'
import type { RegisterFormData } from '@/types/auth'

// ============================================
// COMPONENT
// ============================================

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const { register, isLoading, errors, clearErrors } = useRegister()

  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Get initial message from URL params (e.g., redirect from signin)
  const initialMessage = searchParams?.get('message')

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await register(formData)
  }, [register, formData])

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
    if (hasFieldError(errors, name as keyof RegisterFormData)) {
      clearErrors()
    }
  }, [errors, clearErrors])

  /**
   * Get CSS classes for input field based on error state
   */
  const getInputClasses = useCallback((fieldName: keyof RegisterFormData): string => {
    const baseClasses = 'w-full px-4 py-3 border rounded-lg focus:ring-2 text-gray-900 focus:ring-primary-500 focus:border-transparent transition-colors'
    const hasError = hasFieldError(errors, fieldName)
    
    return `${baseClasses} ${
      hasError 
        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
        : 'border-gray-300 bg-white/50 hover:border-gray-400'
    }`
  }, [errors])

  return (
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
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h1>
          <p className="text-secondary-600">Join DropSpot and start claiming exclusive drops</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          {/* Initial Message */}
          {initialMessage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">{initialMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={getInputClasses('name')}
                  placeholder="Enter your first name"
                  disabled={isLoading}
                />
                {getFieldError(errors, 'name') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'name')}</p>
                )}
              </div>

              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-secondary-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  className={getInputClasses('surname')}
                  placeholder="Enter your last name"
                  disabled={isLoading}
                />
                {getFieldError(errors, 'surname') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'surname')}</p>
                )}
              </div>
            </div>

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
                placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                disabled={isLoading}
              />
              {getFieldError(errors, 'password') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'password')}</p>
              )}
              {!getFieldError(errors, 'password') && (
                <p className="mt-1 text-xs text-secondary-500">
                  Must contain at least 8 characters with uppercase, lowercase and number
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={getInputClasses('confirmPassword')}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {getFieldError(errors, 'confirmPassword') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'confirmPassword')}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-secondary-500">
            By creating an account, you agree to our{' '}
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
  )
}