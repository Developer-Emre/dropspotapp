// ============================================
// SIGNIN HOOK
// ============================================

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { validateSignIn, type ValidationErrors } from '@/lib/validators'
import type { SignInFormData } from '@/types/auth'

// ============================================
// TYPES
// ============================================

interface UseSignInReturn {
  signInUser: (formData: SignInFormData) => Promise<void>
  isLoading: boolean
  errors: ValidationErrors
  apiError: string | null
  clearErrors: () => void
  clearApiError: () => void
}

// ============================================
// HOOK
// ============================================

export function useSignIn(): UseSignInReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Clear API error
   */
  const clearApiError = useCallback(() => {
    setApiError(null)
  }, [])

  /**
   * Sign in user
   */
  const signInUser = useCallback(async (formData: SignInFormData) => {
    try {
      setIsLoading(true)
      setApiError(null)

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
        setApiError('Invalid email or password. Please try again.')
        return
      }

      // Success - redirect to home
      router.push('/')
      router.refresh()

    } catch (error) {
      console.error('Sign in error:', error)
      setApiError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  return {
    signInUser,
    isLoading,
    errors,
    apiError,
    clearErrors,
    clearApiError
  }
}