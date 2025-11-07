// Hook for claim-related operations
import { useState, useEffect, useCallback } from 'react';
import { dropApi, isApiError } from '@/lib/dropApi';
import { ClaimResponse, Claim } from '@/types/drops';
import { logUserAction, logError, logInfo } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';
import { ApiError } from '@/types/errors';

interface UseClaimProps {
  dropId: string;
}

interface ClaimState {
  claim: Claim | null;
  isLoading: boolean;
  error: string | null;
  canClaim: boolean;
  timeRemaining: number | null;
  status: 'idle' | 'claiming' | 'checking' | 'completing';
}

export function useClaim({ dropId }: UseClaimProps) {
  const [state, setState] = useState<ClaimState>({
    claim: null,
    isLoading: false,
    error: null,
    canClaim: false,
    timeRemaining: null,
    status: 'idle',
  });

  // Check current claim status
  const checkClaimStatus = useCallback(async () => {
    if (!dropId) return;

    setState(prev => ({ ...prev, status: 'checking', isLoading: true, error: null }));

    try {
      logUserAction('check_claim_status', { dropId });
      const response = await dropApi.getClaimStatus(dropId);

      if (isApiError(response)) {
        // If no claim found (404), that's not necessarily an error - user just hasn't claimed yet
        if (response.error.code === '404') {
          setState(prev => ({ 
            ...prev, 
            claim: null,
            timeRemaining: null,
            canClaim: true, // User can claim if no existing claim
            isLoading: false,
            status: 'idle',
            error: null
          }));
          return;
        }
        
        const apiError: ApiError = {
          success: false,
          message: response.error.message,
          status: 400
        };
        errorHandler.handleError(apiError, 'claim_drop');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          status: 'idle'
        }));
        logError('Failed to check claim status', response.error);
        return;
      }

      const claim = response.data.claim || null;
      const timeRemaining = claim ? 
        new Date(claim.expiresAt).getTime() - Date.now() : null;

      setState(prev => ({ 
        ...prev, 
        claim,
        timeRemaining,
        canClaim: !claim, // Can claim if no existing claim
        isLoading: false,
        status: 'idle'
      }));

      logInfo('Claim status checked', { dropId, hasClaim: !!claim, timeRemaining });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check claim status';
      errorHandler.handleError(new Error(errorMessage), 'claim_drop');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        status: 'idle'
      }));
      logError('Claim status check failed', error);
    }
  }, [dropId]);

  // Claim a drop
  const claimDrop = useCallback(async () => {
    if (!dropId || !state.canClaim) return false;

    setState(prev => ({ ...prev, status: 'claiming', isLoading: true, error: null }));

    try {
      logUserAction('claim_drop_attempt', { dropId });
      const response = await dropApi.claimDrop(dropId);

      if (isApiError(response)) {
        const apiError: ApiError = {
          success: false,
          message: response.error.message,
          status: 400
        };
        errorHandler.handleError(apiError, 'claim_drop');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          status: 'idle'
        }));
        logError('Failed to claim drop', response.error);
        return false;
      }

      const claim = response.data.claim;
      if (claim) {
        const timeRemaining = new Date(claim.expiresAt).getTime() - Date.now();
        
        setState(prev => ({ 
          ...prev, 
          claim,
          timeRemaining,
          canClaim: false,
          isLoading: false,
          status: 'idle'
        }));

        logUserAction('claim_drop_success', { 
          dropId, 
          claimId: claim.id, 
          expiresAt: claim.expiresAt 
        });
        return true;
      }

      errorHandler.handleError(new Error('Claim failed - no claim data received'), 'claim_drop');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        status: 'idle'
      }));
      return false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim drop';
      errorHandler.handleError(new Error(errorMessage), 'claim_drop');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        status: 'idle'
      }));
      logError('Claim drop failed', error);
      return false;
    }
  }, [dropId, state.canClaim]);

  // Complete a pending claim
  const completeClaim = useCallback(async (claimId: string) => {
    setState(prev => ({ ...prev, status: 'completing', isLoading: true, error: null }));

    try {
      logUserAction('complete_claim_attempt', { dropId, claimId });
      const response = await dropApi.completeClaim(claimId);

      if (isApiError(response)) {
        const apiError: ApiError = {
          success: false,
          message: response.error.message,
          status: 400
        };
        errorHandler.handleError(apiError, 'claim_drop');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          status: 'idle'
        }));
        logError('Failed to complete claim', response.error);
        return false;
      }

      const updatedClaim = response.data.claim;
      if (updatedClaim) {
        setState(prev => ({ 
          ...prev, 
          claim: updatedClaim,
          isLoading: false,
          status: 'idle'
        }));

        logUserAction('complete_claim_success', { 
          dropId, 
          claimId, 
          completedAt: updatedClaim.completedAt 
        });
        return true;
      }

      return false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete claim';
      errorHandler.handleError(new Error(errorMessage), 'claim_drop');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        status: 'idle'
      }));
      logError('Complete claim failed', error);
      return false;
    }
  }, [dropId]);

  // Countdown effect for claim expiry
  useEffect(() => {
    if (!state.claim || state.claim.status !== 'pending') return;

    const interval = setInterval(() => {
      const timeRemaining = new Date(state.claim!.expiresAt).getTime() - Date.now();
      
      if (timeRemaining <= 0) {
        setState(prev => ({
          ...prev,
          timeRemaining: 0,
          claim: prev.claim ? { ...prev.claim, status: 'expired' } : null,
        }));
        clearInterval(interval);
        logUserAction('claim_expired', { 
          dropId, 
          claimId: state.claim!.id 
        });
      } else {
        setState(prev => ({ ...prev, timeRemaining }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.claim, dropId]);

  // Initial load
  useEffect(() => {
    checkClaimStatus();
  }, [checkClaimStatus]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((ms: number | null): string => {
    if (!ms || ms <= 0) return 'Expired';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  return {
    // State
    claim: state.claim,
    isLoading: state.isLoading,
    error: state.error,
    canClaim: state.canClaim,
    timeRemaining: state.timeRemaining,
    status: state.status,
    
    // Actions
    claimDrop,
    completeClaim,
    checkClaimStatus,
    
    // Helpers
    formatTimeRemaining,
    isExpired: state.timeRemaining !== null && state.timeRemaining <= 0,
    isPending: state.claim?.status === 'pending',
    isCompleted: state.claim?.status === 'completed',
    
    // Derived state
    timeRemainingFormatted: state.timeRemaining ? formatTimeRemaining(state.timeRemaining) : null,
  };
}