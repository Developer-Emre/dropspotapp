// API client for drop-related operations

import { 
  Drop, 
  DropsResponse, 
  DropDetailResponse, 
  WaitlistResponse, 
  ClaimResponse,
  ApiError 
} from '@/types/drops';
import { getAuthToken } from './auth-utils';
import { logApiRequest, logApiResponse } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T | ApiError> {
  try {
    // Get authentication token dynamically
    const authToken = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers,
    };
    
    // Production-ready logging
    logApiRequest(options.method || 'GET', `${API_BASE_URL}${endpoint}`, headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    const data = await response.json();
    
    logApiResponse(response.status, endpoint, response.ok ? undefined : data);

    if (!response.ok) {
      // Debug log to see what backend sends
      console.log('🐛 API Error Response:', { 
        status: response.status, 
        data,
        dataMessage: data.message,
        dataErrorMessage: data.error?.message,
        fullData: JSON.stringify(data, null, 2)
      });
      
      // Extract the correct error message from nested structure
      const errorMessage = data.error?.message || data.message || `HTTP Error: ${response.status}`;
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: data.error?.code || data.code || response.status.toString(),
          details: data,
        },
      } as ApiError;
    }

    return data as T;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
      },
    } as ApiError;
  }
}

// Helper function to check if response is an error
export function isApiError(response: any): response is ApiError {
  return response && response.success === false;
}

// Drop API functions
export const dropApi = {
  // Get all drops
  async getDrops(): Promise<DropsResponse | ApiError> {
    return apiRequest<DropsResponse>('/drops');
  },

  // Get specific drop by ID
  async getDrop(id: string): Promise<DropDetailResponse | ApiError> {
    return apiRequest<DropDetailResponse>(`/drops/${id}`);
  },

  // Join waitlist for a drop
  async joinWaitlist(dropId: string): Promise<WaitlistResponse | ApiError> {
    return apiRequest<WaitlistResponse>(`/drops/${dropId}/join`, {
      method: 'POST',
    });
  },

  // Leave waitlist for a drop
  async leaveWaitlist(dropId: string): Promise<WaitlistResponse | ApiError> {
    return apiRequest<WaitlistResponse>(`/drops/${dropId}/leave`, {
      method: 'POST',
    });
  },

  // Get waitlist status for a drop (user's own status)
  async getWaitlistStatus(dropId: string): Promise<WaitlistResponse | ApiError> {
    return apiRequest<WaitlistResponse>(`/drops/${dropId}/my-waitlist-status`);
  },

  // Claim a drop
  async claimDrop(dropId: string): Promise<ClaimResponse | ApiError> {
    return apiRequest<ClaimResponse>(`/drops/${dropId}/claim`, {
      method: 'POST',
    });
  },

  // Get user's claims
  async getUserClaims(): Promise<{ success: boolean; data: any[] } | ApiError> {
    return apiRequest<{ success: boolean; data: any[] }>('/my-claims');
  },

  // Get claim status for a specific drop
  async getClaimStatus(dropId: string): Promise<ClaimResponse | ApiError> {
    return apiRequest<ClaimResponse>(`/drops/${dropId}/claim-status`);
  },

  // Complete a pending claim
  async completeClaim(claimId: string): Promise<ClaimResponse | ApiError> {
    return apiRequest<ClaimResponse>(`/claims/${claimId}/complete`, {
      method: 'POST',
    });
  },

  // Get claim history with filters
  async getClaimHistory(filters?: {
    status?: 'pending' | 'completed' | 'expired';
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: any[]; count: number } | ApiError> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    const endpoint = `/my-claims${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{ success: boolean; data: any[]; count: number }>(endpoint);
  },

  // Get user's waitlists
  async getUserWaitlists(): Promise<{ 
    success: boolean; 
    data: { 
      waitlists: any[]; 
      pagination: any;
      summary: any;
    } 
  } | ApiError> {
    return apiRequest<{ 
      success: boolean; 
      data: { 
        waitlists: any[]; 
        pagination: any;
        summary: any;
      } 
    }>('/my-waitlists');
  },
};

// Utility functions for drop logic
export const dropUtils = {
  // Calculate current phase of a drop
  calculatePhase(drop: Drop): { current: string; timeRemaining?: number; nextPhase?: string } {
    const now = new Date().getTime();
    const startDate = new Date(drop.startDate).getTime();
    const claimStart = new Date(drop.claimWindowStart).getTime();
    const claimEnd = new Date(drop.claimWindowEnd).getTime();
    const endDate = new Date(drop.endDate).getTime();

    if (now < startDate) {
      return {
        current: 'upcoming',
        timeRemaining: startDate - now,
        nextPhase: 'waitlist',
      };
    }

    if (now >= startDate && now < claimStart) {
      return {
        current: 'waitlist',
        timeRemaining: claimStart - now,
        nextPhase: 'claiming',
      };
    }

    if (now >= claimStart && now < claimEnd) {
      return {
        current: 'claiming',
        timeRemaining: claimEnd - now,
        nextPhase: 'ended',
      };
    }

    return {
      current: 'ended',
    };
  },

  // Format time remaining
  formatTimeRemaining(milliseconds: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
  } {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    let formatted = '';
    if (days > 0) formatted += `${days}d `;
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0) formatted += `${minutes}m `;
    if (seconds > 0) formatted += `${seconds}s`;

    return { days, hours, minutes, seconds, formatted: formatted.trim() };
  },

  // Get phase display text
  getPhaseDisplayText(phase: string): string {
    switch (phase) {
      case 'upcoming':
        return 'Coming Soon';
      case 'waitlist':
        return 'Join Waitlist';
      case 'claiming':
        return 'Claim Now';
      case 'ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  },

  // Get phase color theme
  getPhaseColor(phase: string): string {
    switch (phase) {
      case 'upcoming':
        return 'blue';
      case 'waitlist':
        return 'yellow';
      case 'claiming':
        return 'green';
      case 'ended':
        return 'gray';
      default:
        return 'gray';
    }
  },

  // Check if user can perform action
  canJoinWaitlist(drop: Drop): boolean {
    const phase = this.calculatePhase(drop);
    return phase.current === 'waitlist' && drop.availableStock > 0;
  },

  canClaim(drop: Drop): boolean {
    const phase = this.calculatePhase(drop);
    return phase.current === 'claiming' && drop.availableStock > 0;
  },
};