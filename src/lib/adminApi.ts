// Admin API client for drop management operations
// Backend controller'a uygun endpoint'ler

import { getAuthToken } from './auth-utils';
import { logApiRequest, logApiResponse } from './logger';
import { AdminDropFormData, AdminDrop, AdminDropStats } from '@/store/adminStore';
import { ApiError } from '@/types/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function for admin API requests
async function adminApiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T | ApiError> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getAuthToken();
  
  if (!token) {
    return {
      success: false,
      message: 'Authentication required',
      status: 401
    } as ApiError;
  }

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  logApiRequest(url, JSON.stringify(requestOptions));

  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    logApiResponse(response.status, url, data);

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${response.status}`,
        status: response.status,
        error: data.error,
        errors: data.errors // Backend'den gelen validation errors'ları koru
      } as ApiError;
    }

    return data;
  } catch (error) {
    console.error('Admin API request failed:', error);
    return {
      success: false,
      message: 'Network error',
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiError;
  }
}

// Type guard for API error responses
export function isAdminApiError(response: any): response is ApiError {
  return response && response.success === false;
}

// Admin API functions
// Get all drops for admin management
export async function getDrops() {
  return adminApiRequest<{ success: boolean; data: AdminDrop[]; count: number }>('/drops/admin');
}

// Get single drop for editing (Admin Only)
export async function getDrop(id: string): Promise<{ success: boolean; data: AdminDrop } | ApiError> {
  return adminApiRequest<{ success: boolean; data: AdminDrop }>(`/drops/admin/${id}`);
}

// Create new drop (Admin Only)
export async function createDrop(data: AdminDropFormData): Promise<{ success: boolean; data: AdminDrop; message: string } | ApiError> {
  const requestBody: any = {
    title: data.title, // Backend API 'title' bekliyor
    description: data.description,
    totalStock: data.totalStock,
    startDate: data.startDate,
    endDate: data.endDate,
    claimWindowStart: data.claimWindowStart,
    claimWindowEnd: data.endDate, // Backend'de claimWindowEnd gerekiyor
  };
  
  // ImageUrl sadece dolu ise ekle
  if (data.imageUrl && data.imageUrl.trim()) {
    requestBody.imageUrl = data.imageUrl.trim();
  }

  return adminApiRequest<{ success: boolean; data: AdminDrop; message: string }>('/drops/admin', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

// Update existing drop (Admin Only)
export async function updateDrop(
  id: string, 
  data: Partial<AdminDropFormData>
): Promise<{ success: boolean; data: AdminDrop; message: string } | ApiError> {
  const updateData: any = {};
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.totalStock !== undefined) updateData.totalStock = data.totalStock;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.claimWindowStart !== undefined) updateData.claimWindowStart = data.claimWindowStart;
  
  // ClaimWindowEnd backend'de zorunlu - endDate ile aynı değeri kullan
  if (data.endDate !== undefined) updateData.claimWindowEnd = data.endDate;
  
  // ImageUrl sadece dolu ise ekle
  if (data.imageUrl !== undefined && data.imageUrl && data.imageUrl.trim()) {
    updateData.imageUrl = data.imageUrl.trim();
  }

  return adminApiRequest<{ success: boolean; data: AdminDrop; message: string }>(`/drops/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
}

// Delete drop (Admin Only)
export async function deleteDrop(id: string): Promise<{ success: boolean; message: string } | ApiError> {
  return adminApiRequest<{ success: boolean; message: string }>(`/drops/admin/${id}`, {
    method: 'DELETE',
  });
}

// Bulk delete drops (Admin Only) - Frontend convenience function
export async function bulkDeleteDrops(ids: string[]): Promise<{ success: boolean; message: string } | ApiError> {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteDrop(id))
    );
    
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
    
    if (failed.length > 0) {
      // Get the first specific error message from backend
      const firstFailedResult = failed[0];
      let specificMessage = `Failed to delete ${failed.length} out of ${ids.length} drops`;
      
      if (firstFailedResult.status === 'fulfilled' && firstFailedResult.value && !firstFailedResult.value.success) {
        // This is an API error response
        const errorResponse = firstFailedResult.value as ApiError;
        specificMessage = errorResponse.message || specificMessage;
      }
      
      return {
        success: false,
        message: specificMessage,
        status: 500
      } as ApiError;
    }
    
    return {
      success: true,
      message: `Successfully deleted ${ids.length} drops`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bulk delete operation failed',
      status: 500
    } as ApiError;
  }
}

// Admin validation helpers
export const adminValidation = {
  validateDropDates: (startDate: string, endDate: string, claimWindowStart: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const claimStart = new Date(claimWindowStart);
    const now = new Date();

    const errors: string[] = [];

    if (start <= now) {
      errors.push('Start date must be in the future');
    }

    if (end <= start) {
      errors.push('End date must be after start date');
    }

    if (claimStart <= start) {
      errors.push('Claim window start must be after drop start date');
    }

    if (claimStart >= end) {
      errors.push('Claim window start must be before drop end date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateDropForm: (data: AdminDropFormData) => {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.trim().length === 0) {
      errors.title = 'Title is required';
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.description = 'Description is required';
    }

    if (!data.totalStock || data.totalStock <= 0) {
      errors.totalStock = 'Total stock must be greater than 0';
    }

    if (!data.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!data.endDate) {
      errors.endDate = 'End date is required';
    }

    if (!data.claimWindowStart) {
      errors.claimWindowStart = 'Claim window start is required';
    }

    // Date validation if all dates exist
    if (data.startDate && data.endDate && data.claimWindowStart) {
      const dateValidation = adminValidation.validateDropDates(
        data.startDate,
        data.endDate,
        data.claimWindowStart
      );

      if (!dateValidation.isValid) {
        dateValidation.errors.forEach((error) => {
          if (error.includes('Start date')) errors.startDate = error;
          if (error.includes('End date')) errors.endDate = error;
          if (error.includes('Claim window')) errors.claimWindowStart = error;
        });
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};