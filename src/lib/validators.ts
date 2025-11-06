import type { RegisterRequest, LoginRequest, SignInFormData } from '@/types/auth'
import { sanitizeEmail, sanitizeName, sanitizeText, validatePasswordSecurity } from './security'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

export type ValidationErrors = { [key: string]: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_REGEX = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

const VALIDATION_RULES = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters long',
    complexity: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  },
  name: {
    required: 'Name is required',
    minLength: 'Name must be at least 2 characters long',
    maxLength: 'Name must be no more than 50 characters long',
    invalid: 'Name can only contain letters and spaces'
  },
  surname: {
    required: 'Surname is required',
    minLength: 'Surname must be at least 2 characters long',
    maxLength: 'Surname must be no more than 50 characters long',
    invalid: 'Surname can only contain letters and spaces'
  }
}

export const validateLoginRequest = (credentials: LoginRequest): ValidationResult => {
  const errors: ValidationError[] = []

  if (!credentials.email) {
    errors.push({ field: 'email', message: VALIDATION_RULES.email.required })
  } else if (!EMAIL_REGEX.test(credentials.email)) {
    errors.push({ field: 'email', message: VALIDATION_RULES.email.invalid })
  }

  if (!credentials.password) {
    errors.push({ field: 'password', message: VALIDATION_RULES.password.required })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateSignIn = (formData: SignInFormData): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {}

  // Sanitize inputs
  const sanitizedData = {
    email: sanitizeEmail(formData.email),
    password: sanitizeText(formData.password)
  }

  if (!sanitizedData.email) {
    errors.email = VALIDATION_RULES.email.required
  } else if (!EMAIL_REGEX.test(sanitizedData.email)) {
    errors.email = VALIDATION_RULES.email.invalid
  }

  if (!sanitizedData.password) {
    errors.password = VALIDATION_RULES.password.required
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateRegisterRequest = (userData: RegisterRequest): ValidationResult => {
  const errors: ValidationError[] = []

  if (!userData.email) {
    errors.push({ field: 'email', message: VALIDATION_RULES.email.required })
  } else if (!EMAIL_REGEX.test(userData.email)) {
    errors.push({ field: 'email', message: VALIDATION_RULES.email.invalid })
  }

  if (!userData.password) {
    errors.push({ field: 'password', message: VALIDATION_RULES.password.required })
  } else {
    if (userData.password.length < 8) {
      errors.push({ field: 'password', message: VALIDATION_RULES.password.minLength })
    }
    if (!PASSWORD_COMPLEXITY_REGEX.test(userData.password)) {
      errors.push({ field: 'password', message: VALIDATION_RULES.password.complexity })
    }
  }

  if (!userData.name) {
    errors.push({ field: 'name', message: VALIDATION_RULES.name.required })
  } else {
    if (userData.name.length < 2) {
      errors.push({ field: 'name', message: VALIDATION_RULES.name.minLength })
    }
    if (userData.name.length > 50) {
      errors.push({ field: 'name', message: VALIDATION_RULES.name.maxLength })
    }
    if (!NAME_REGEX.test(userData.name)) {
      errors.push({ field: 'name', message: VALIDATION_RULES.name.invalid })
    }
  }

  if (!userData.surname) {
    errors.push({ field: 'surname', message: VALIDATION_RULES.surname.required })
  } else {
    if (userData.surname.length < 2) {
      errors.push({ field: 'surname', message: VALIDATION_RULES.surname.minLength })
    }
    if (userData.surname.length > 50) {
      errors.push({ field: 'surname', message: VALIDATION_RULES.surname.maxLength })
    }
    if (!NAME_REGEX.test(userData.surname)) {
      errors.push({ field: 'surname', message: VALIDATION_RULES.surname.invalid })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateRegisterForm = (formData: {
  email: string
  password: string
  confirmPassword: string
  name: string
  surname: string
}): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {}

  // Sanitize inputs
  const sanitizedData = {
    email: sanitizeEmail(formData.email),
    name: sanitizeName(formData.name),
    surname: sanitizeName(formData.surname),
    password: sanitizeText(formData.password),
    confirmPassword: sanitizeText(formData.confirmPassword)
  }

  // Email validation
  if (!sanitizedData.email) {
    errors.email = VALIDATION_RULES.email.required
  } else if (!EMAIL_REGEX.test(sanitizedData.email)) {
    errors.email = VALIDATION_RULES.email.invalid
  }

  // Password security validation
  if (!sanitizedData.password) {
    errors.password = VALIDATION_RULES.password.required
  } else {
    const passwordValidation = validatePasswordSecurity(sanitizedData.password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0] // Show first error
    }
  }

  // Confirm password validation
  if (!sanitizedData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (sanitizedData.password !== sanitizedData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  // Name validation
  if (!sanitizedData.name) {
    errors.name = VALIDATION_RULES.name.required
  } else {
    if (sanitizedData.name.length < 2) {
      errors.name = VALIDATION_RULES.name.minLength
    } else if (sanitizedData.name.length > 50) {
      errors.name = VALIDATION_RULES.name.maxLength
    } else if (!NAME_REGEX.test(sanitizedData.name)) {
      errors.name = VALIDATION_RULES.name.invalid
    }
  }

  // Surname validation
  if (!sanitizedData.surname) {
    errors.surname = VALIDATION_RULES.surname.required
  } else {
    if (sanitizedData.surname.length < 2) {
      errors.surname = VALIDATION_RULES.surname.minLength
    } else if (sanitizedData.surname.length > 50) {
      errors.surname = VALIDATION_RULES.surname.maxLength
    } else if (!NAME_REGEX.test(sanitizedData.surname)) {
      errors.surname = VALIDATION_RULES.surname.invalid
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Legacy function for backward compatibility
export const validateRegisterFormLegacy = (formData: {
  email: string
  password: string
  name: string
  surname: string
}): ValidationResult => {
  return validateRegisterRequest(formData)
}

export const getFieldError = (errors: ValidationErrors, field: string): string | undefined => {
  return errors[field]
}

export const hasFieldError = (errors: ValidationErrors, field: string): boolean => {
  return !!errors[field]
}

export const clearFieldError = (errors: ValidationErrors, field: string): ValidationErrors => {
  const newErrors = { ...errors }
  delete newErrors[field]
  return newErrors
}