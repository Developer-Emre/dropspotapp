// Drop-related TypeScript interfaces based on API response

export interface Drop {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  totalStock: number;
  claimedStock: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  claimWindowStart: string; // ISO date string
  claimWindowEnd: string; // ISO date string
  createdAt: string; // ISO date string
  availableStock: number; // calculated field
  waitlistCount: number; // calculated field
  status: DropStatus;
  _count?: {
    waitlistEntries?: number;
    claims?: number;
  };
}

export type DropStatus = 'upcoming' | 'waitlist' | 'claiming' | 'ended';

export interface DropPhase {
  current: DropStatus;
  timeRemaining?: number; // milliseconds until next phase
  nextPhase?: DropStatus;
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  dropId: string;
  priorityScore: number;
  position?: number; // calculated field
  joinedAt: string; // ISO date string
  isEligible?: boolean; // calculated field for claim window
}

export interface Claim {
  id: string;
  userId: string;
  dropId: string;
  claimCode: string;
  status: ClaimStatus;
  expiresAt: string; // ISO date string
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string
}

export type ClaimStatus = 'pending' | 'completed' | 'expired';

// API Response Types
export interface DropsResponse {
  success: boolean;
  data: Drop[];
  count: number;
}

export interface DropDetailResponse {
  success: boolean;
  data: Drop;
}

export interface WaitlistResponse {
  success: boolean;
  data: {
    entry?: WaitlistEntry;
    position: number;
    totalEntries: number;
    isJoined: boolean;
  };
}

export interface ClaimResponse {
  success: boolean;
  data: {
    claim?: Claim;
    message: string;
  };
}

// API Error Response
export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Helper types for UI components
export interface DropCardProps {
  drop: Drop;
  onJoinWaitlist?: (dropId: string) => void;
  onLeaveWaitlist?: (dropId: string) => void;
  userWaitlistStatus?: {
    isJoined: boolean;
    position?: number;
  };
}

export interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
  showLabels?: boolean;
  compact?: boolean;
}

export interface PhaseIndicatorProps {
  phase: DropPhase;
  compact?: boolean;
}

// Utility functions types
export type DropPhaseCalculator = (drop: Drop) => DropPhase;
export type TimeFormatter = (milliseconds: number) => {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};