// ============================================
// SIGNIN HOOK
// ============================================

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { validateSignIn, type ValidationErrors } from '@/lib/validators'
import type { SignInFormData } from '@/types/auth'
import { errorHandler } from '@/lib/errorHandler'
import { ApiError } from '@/types/errors'
import { useErrorToast } from '@/providers/ErrorToastProvider'

// ============================================
// TYPES
// ============================================

interface UseSignInReturn {
  signInUser: (formData: SignInFormData) => Promise<void>
  isLoading: boolean
  errors: ValidationErrors
  clearErrors: () => void
}

// ============================================
// HOOK
// ============================================

export function useSignIn(): UseSignInReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const router = useRouter()
  const { showSuccess, showError } = useErrorToast()

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Sign in user
   */
  const signInUser = useCallback(async (formData: SignInFormData) => {
    try {
      setIsLoading(true)

      // Validate form data
      const validationResult = validateSignIn(formData)
      if (!validationResult.isValid) {
        setErrors(validationResult.errors)
        return
      }

      // Clear validation errors
      setErrors({})

      // Attempt sign in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth error - could be invalid credentials or server error
        let errorMessage = 'Invalid email or password';
        
        // Try to parse more specific error info from result
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email or password';
        } else if (result.error.includes('fetch')) {
          errorMessage = 'Unable to connect to server';
        }
        
        showError('Sign In Failed', errorMessage);
        return
      }

      // Success - show success message and redirect
      showSuccess('Welcome Back!', 'You have successfully signed in')
      router.push('/')
      router.refresh()

    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showError('Sign In Failed', errorMessage);
    } finally {
      setIsLoading(false)
    }
  }, [router, showSuccess, showError])

  return {
    signInUser,
    isLoading,
    errors,
    clearErrors
  }
}