// ============================================
// REGISTER CUSTOM HOOK
// ============================================

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/lib/api'
import { validateRegisterForm, type ValidationErrors } from '@/lib/validators'
import type { 
  RegisterFormData, 
  RegisterRequest, 
  RegisterResponse 
} from '@/types/auth'

// ============================================
// HOOK STATE TYPES
// ============================================

interface UseRegisterState {
  isLoading: boolean
  errors: ValidationErrors
  apiError: string | null
}

interface UseRegisterActions {
  register: (formData: RegisterFormData) => Promise<void>
  clearErrors: () => void
  clearApiError: () => void
}

interface UseRegisterReturn extends UseRegisterState, UseRegisterActions {}

// ============================================
// CUSTOM HOOK
// ============================================

/**
 * Custom hook for handling user registration
 * @returns UseRegisterReturn object with state and actions
 */
export const useRegister = (): UseRegisterReturn => {
  const router = useRouter()
  
  // State management
  const [state, setState] = useState<UseRegisterState>({
    isLoading: false,
    errors: {},
    apiError: null
  })

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }))
  }, [])

  /**
   * Clear API error
   */
  const clearApiError = useCallback(() => {
    setState(prev => ({ ...prev, apiError: null }))
  }, [])

  /**
   * Handle successful registration
   * @param response - Registration response from API
   */
  const handleRegistrationSuccess = useCallback(async (
    response: RegisterResponse
  ): Promise<void> => {
    // Registration successful - redirect to sign-in with success message
    const message = encodeURIComponent('Registration successful! Please sign in with your credentials.')
    router.push(`/auth/signin?message=${message}`)
  }, [router])

  /**
   * Handle registration failure
   * @param response - Failed registration response
   */
  const handleRegistrationFailure = useCallback((response: RegisterResponse): void => {
    const errorMessage = response.error || response.message || 'Registration failed'
    setState(prev => ({ 
      ...prev, 
      apiError: errorMessage,
      isLoading: false 
    }))
  }, [])

  /**
   * Register user
   * @param formData - Registration form data
   */
  const register = useCallback(async (formData: RegisterFormData): Promise<void> => {
    // Clear previous errors
    setState(prev => ({ ...prev, errors: {}, apiError: null }))

    // Validate form data
    const validation = validateRegisterForm(formData)
    if (!validation.isValid) {
      setState(prev => ({ 
        ...prev, 
        errors: validation.errors,
        isLoading: false 
      }))
      return
    }

    // Set loading state
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Prepare API request data
      const registerData: RegisterRequest = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      }

      // Call registration API
      const response = await registerUser(registerData)

      if (response.success) {
        // Handle successful registration
        await handleRegistrationSuccess(response)
      } else {
        // Handle registration failure
        handleRegistrationFailure(response)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setState(prev => ({ 
        ...prev, 
        apiError: 'Something went wrong. Please try again.',
        isLoading: false 
      }))
    }
  }, [handleRegistrationSuccess, handleRegistrationFailure])

  return {
    // State
    isLoading: state.isLoading,
    errors: state.errors,
    apiError: state.apiError,
    
    // Actions
    register,
    clearErrors,
    clearApiError
  }
}