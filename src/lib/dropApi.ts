// API client for drop-related operations

import { 
  Drop, 
  DropsResponse, 
  DropDetailResponse, 
  WaitlistResponse, 
  ClaimResponse,
  ApiError 
} from '@/types/drops';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T | ApiError> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.message || `HTTP Error: ${response.status}`,
          code: data.code || response.status.toString(),
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
  async getDropById(dropId: string): Promise<DropDetailResponse | ApiError> {
    return apiRequest<DropDetailResponse>(`/drops/${dropId}`);
  },

  // Join waitlist for a drop
  async joinWaitlist(dropId: string, token?: string): Promise<WaitlistResponse | ApiError> {
    return apiRequest<WaitlistResponse>(`/drops/${dropId}/join`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Leave waitlist for a drop
  async leaveWaitlist(dropId: string, token?: string): Promise<WaitlistResponse | ApiError> {
    return apiRequest<WaitlistResponse>(`/drops/${dropId}/leave`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Get waitlist status for a drop
  async getWaitlistStatus(dropId: string, token?: string): Promise<WaitlistResponse | ApiError> {
    return apiRequest<WaitlistResponse>(`/drops/${dropId}/waitlist`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Claim a drop
  async claimDrop(dropId: string, token?: string): Promise<ClaimResponse | ApiError> {
    return apiRequest<ClaimResponse>(`/drops/${dropId}/claim`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // Get user's claims
  async getUserClaims(token?: string): Promise<{ success: boolean; data: any[] } | ApiError> {
    return apiRequest<{ success: boolean; data: any[] }>('/my-claims', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
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