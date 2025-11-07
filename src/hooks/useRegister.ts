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
import { errorHandler } from '@/lib/errorHandler'
import { ApiError } from '@/types/errors'
import { useErrorToast } from '@/providers/ErrorToastProvider'

// ============================================
// HOOK STATE TYPES
// ============================================

interface UseRegisterState {
  isLoading: boolean
  errors: ValidationErrors
}

interface UseRegisterActions {
  register: (formData: RegisterFormData) => Promise<void>
  clearErrors: () => void
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
  const { showSuccess } = useErrorToast()
  
  // State management
  const [state, setState] = useState<UseRegisterState>({
    isLoading: false,
    errors: {}
  })

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }))
  }, [])

  /**
   * Handle successful registration
   * @param response - Registration response from API
   */
  const handleRegistrationSuccess = useCallback(async (
    response: RegisterResponse
  ): Promise<void> => {
    // Show success toast
    showSuccess('Registration Successful', 'Please sign in with your credentials')
    
    // Redirect to sign-in page
    router.push('/auth/signin')
  }, [router, showSuccess])

  /**
   * Handle registration failure
   * @param response - Failed registration response
   */
  const handleRegistrationFailure = useCallback((response: RegisterResponse): void => {
    const apiError: ApiError = {
      success: false,
      message: response.error || response.message || 'Registration failed',
      status: response.status || 400
    };
    errorHandler.handleError(apiError, 'auth_register');
    setState(prev => ({ 
      ...prev, 
      isLoading: false 
    }))
  }, [])

  /**
   * Register user
   * @param formData - Registration form data
   */
  const register = useCallback(async (formData: RegisterFormData): Promise<void> => {
    // Clear previous errors
    setState(prev => ({ ...prev, errors: {} }))

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
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      errorHandler.handleError(new Error(errorMessage), 'auth_register');
      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }))
    }
  }, [handleRegistrationSuccess, handleRegistrationFailure])

  return {
    // State
    isLoading: state.isLoading,
    errors: state.errors,
    
    // Actions
    register,
    clearErrors
  }
}