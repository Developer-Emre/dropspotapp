'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { dropApi, isApiError } from '@/lib/dropApi';
import { WaitlistResponse } from '@/types/drops';

export interface WaitlistStatus {
  isJoined: boolean;
  position?: number;
  totalWaiting?: number;
  priorityScore?: number;
  joinedAt?: string;
  estimatedClaimChance?: 'high' | 'medium' | 'low';
}

export interface UseWaitlistReturn {
  waitlistStatus: WaitlistStatus;
  isLoading: boolean;
  error: string | null;
  joinWaitlist: (dropId: string) => Promise<boolean>;
  leaveWaitlist: (dropId: string) => Promise<boolean>;
  checkWaitlistStatus: (dropId: string) => Promise<void>;
  clearError: () => void;
}

export function useWaitlist(): UseWaitlistReturn {
  const { data: session } = useSession();
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>({
    isJoined: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    // Authentication is now handled automatically by dropApi
    // No need to manually pass tokens
    return session?.user ? 'authenticated' : null;
  }, [session]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkWaitlistStatus = useCallback(async (dropId: string) => {
    if (!session?.user) {
      setWaitlistStatus({ isJoined: false });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await dropApi.getWaitlistStatus(dropId);

      if (isApiError(response)) {
        setError(response.error.message);
        setWaitlistStatus({ isJoined: false });
        return;
      }

      setWaitlistStatus({
        isJoined: response.data.inWaitlist || false,
        position: response.data.position,
        totalWaiting: response.data.totalWaiting,
        priorityScore: response.data.entry?.priorityScore,
        joinedAt: response.data.entry?.joinedAt,
        estimatedClaimChance: response.data.estimatedClaimChance,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check waitlist status';
      setError(errorMessage);
      setWaitlistStatus({ isJoined: false });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const joinWaitlist = useCallback(async (dropId: string): Promise<boolean> => {
    if (!session?.user) {
      setError('Please sign in to join waitlist');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await dropApi.joinWaitlist(dropId);

      if (isApiError(response)) {
        setError(response.error.message);
        return false;
      }

      // Update waitlist status based on response
      if (response.data.waitlistEntry) {
        setWaitlistStatus({
          isJoined: true,
          position: response.data.waitlistEntry.position,
          priorityScore: response.data.waitlistEntry.priorityScore,
          joinedAt: response.data.waitlistEntry.joinedAt,
        });
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join waitlist';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const leaveWaitlist = useCallback(async (dropId: string): Promise<boolean> => {
    if (!session?.user) {
      setError('Authentication required');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await dropApi.leaveWaitlist(dropId);

      if (isApiError(response)) {
        setError(response.error.message);
        return false;
      }

      // Reset waitlist status
      setWaitlistStatus({ isJoined: false });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave waitlist';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  return {
    waitlistStatus,
    isLoading,
    error,
    joinWaitlist,
    leaveWaitlist,
    checkWaitlistStatus,
    clearError,
  };
}