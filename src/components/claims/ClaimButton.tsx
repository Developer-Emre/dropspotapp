// Claim button component
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Drop, ClaimStatus } from '@/types/drops';
import { useClaimStore, useClaimForDrop, useClaimLoading, useClaimError } from '@/store/claimStore';
import { logUserAction, logError } from '@/lib/logger';

// Mock dropUtils for now
const dropUtils = {
  calculatePhase: (drop: Drop) => {
    const now = Date.now();
    const claimStart = new Date(drop.claimWindowStart).getTime();
    const claimEnd = new Date(drop.claimWindowEnd).getTime();
    
    if (now < claimStart) return 'upcoming';
    if (now > claimEnd) return 'ended';
    return 'claiming';
  },
  canClaim: (drop: Drop) => {
    const phase = dropUtils.calculatePhase(drop);
    return phase === 'claiming' && drop.availableStock > 0;
  }
};

interface ClaimButtonProps {
  drop: Drop;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  onSuccess?: (claimId: string) => void;
  onError?: (error: string) => void;
}

export function ClaimButton({
  drop,
  className = '',
  size = 'md',
  variant = 'primary',
  disabled = false,
  onSuccess,
  onError,
}: ClaimButtonProps) {
  const [hasClicked, setHasClicked] = useState(false);
  
  // Memoize store actions to prevent unnecessary re-renders
  const claimDrop = useClaimStore(state => state.claimDrop);
  const clearError = useClaimStore(state => state.clearError);
  
  // Get claim data for this drop
  const existingClaim = useClaimForDrop(drop.id);
  const isLoading = useClaimLoading('claiming', drop.id);
  const error = useClaimError('claiming', drop.id);
  
  // Memoize calculations to prevent unnecessary recalculations
  const phase = useMemo(() => dropUtils.calculatePhase(drop), [drop]);
  const canClaim = useMemo(() => dropUtils.canClaim(drop), [drop]);
  
  // Determine button state
  const buttonState = useMemo(() => {
    if (existingClaim) {
      switch (existingClaim.status) {
        case 'pending':
          return {
            text: 'Claim Pending',
            emoji: '⏳',
            variant: 'outline' as const,
            disabled: true,
          };
        case 'completed':
          return {
            text: 'Already Claimed',
            emoji: '✅',
            variant: 'outline' as const,
            disabled: true,
          };
        case 'expired':
          return {
            text: 'Claim Expired',
            emoji: '⏰',
            variant: 'outline' as const,
            disabled: true,
          };
      }
    }

    if (isLoading) {
      return {
        text: 'Claiming...',
        emoji: '',
        variant: 'primary' as const,
        disabled: true,
      };
    }

    if (phase === 'upcoming') {
      return {
        text: 'Coming Soon',
        emoji: '�',
        variant: 'outline' as const,
        disabled: true,
      };
    }

    if (phase === 'ended') {
      return {
        text: 'Drop Ended',
        emoji: '⏰',
        variant: 'outline' as const,
        disabled: true,
      };
    }

    if (!canClaim) {
      if (drop.availableStock <= 0) {
        return {
          text: 'Out of Stock',
          emoji: '❌',
          variant: 'outline' as const,
          disabled: true,
        };
      }
    }
    
    return {
      text: 'Claim Now',
      emoji: '⬇️',
      variant: variant,
      disabled: false,
    };
  }, [existingClaim, isLoading, phase, canClaim, drop.availableStock, variant]);
  
  const isDisabled = disabled || buttonState.disabled || isLoading;

  const handleClaim = async () => {
    if (isDisabled || !canClaim || existingClaim) return;
    
    setHasClicked(true);
    
    // Clear any previous errors
    if (error) {
      clearError('claiming', drop.id);
    }
    
    try {
      const success = await claimDrop(drop.id);
      
      if (success) {
        // Get the latest claim data after successful claim
        const latestClaim = useClaimStore.getState().claimsByDrop.get(drop.id);
        const claimData = latestClaim ? useClaimStore.getState().claims.get(latestClaim) : null;
        onSuccess?.(claimData?.id || '');
      } else {
        const currentError = useClaimStore.getState().errors.claiming.get(drop.id);
        onError?.(currentError || 'Failed to claim drop');
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClaim}
        disabled={isDisabled}
        variant={buttonState.variant}
        size={size}
        className={`w-full ${className}`}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Claiming...
          </>
        ) : (
          <>
            <span className="mr-2">{buttonState.emoji}</span>
            {buttonState.text}
          </>
        )}
      </Button>
      
      {/* Note: Error handling now managed by central error handler with toast notifications */}
      {/* Keeping this for fallback but toast system takes precedence */}
      {error && hasClicked && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-2">
          <div className="flex items-center">
            <span className="mr-2">🐛</span>
            <span>Debug: {error}</span>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {existingClaim && hasClicked && !error && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <span>Successfully claimed! Check My Claims for details.</span>
          </div>
        </div>
      )}
      
      {/* Claim info */}
      {existingClaim && (
        <div className="text-xs text-gray-500 text-center">
          <div>Claim Code: {existingClaim.claimCode}</div>
          {existingClaim.status === 'pending' && existingClaim.expiresAt && (
            <div className="text-orange-600">
              Expires: {new Date(existingClaim.expiresAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}