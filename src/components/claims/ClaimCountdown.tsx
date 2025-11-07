// ClaimCountdown component for showing claim expiry countdown
'use client';

import { useState, useEffect } from 'react';
import { Claim } from '@/types/drops';

interface ClaimCountdownProps {
  claim: Claim;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onExpiry?: () => void;
  showLabel?: boolean;
}

export function ClaimCountdown({
  claim,
  className = '',
  size = 'md',
  onExpiry,
  showLabel = true,
}: ClaimCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const expiryTime = new Date(claim.expiresAt).getTime();
      const now = Date.now();
      const remaining = expiryTime - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        if (!hasExpired) {
          setHasExpired(true);
          onExpiry?.();
        }
      } else {
        setTimeRemaining(remaining);
        setHasExpired(false);
      }
    };

    // Calculate initial time
    calculateTimeRemaining();

    // Only set interval if claim is pending and not expired
    if (claim.status === 'pending' && !hasExpired) {
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [claim.expiresAt, claim.status, hasExpired, onExpiry]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(timeRemaining);

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-sm',
      number: 'text-lg font-bold',
      label: 'text-xs',
      unit: 'px-2 py-1',
    },
    md: {
      container: 'text-base',
      number: 'text-xl font-bold',
      label: 'text-sm',
      unit: 'px-3 py-2',
    },
    lg: {
      container: 'text-lg',
      number: 'text-2xl font-bold',
      label: 'text-base',
      unit: 'px-4 py-3',
    },
  };

  const classes = sizeClasses[size];

  // Don't render if claim is completed or not pending
  if (claim.status !== 'pending') {
    return null;
  }

  // Render expired state
  if (hasExpired || timeRemaining <= 0) {
    return (
      <div className={`${classes.container} ${className}`}>
        <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
          <div className="text-red-700 font-medium">
            ⏰ Claim Expired
          </div>
          <div className="text-red-600 text-sm mt-1">
            This claim has expired and is no longer valid
          </div>
        </div>
      </div>
    );
  }

  // Get urgency level for styling
  const getUrgencyLevel = () => {
    const totalHours = timeRemaining / (1000 * 60 * 60);
    if (totalHours <= 2) return 'critical'; // 2 hours or less
    if (totalHours <= 6) return 'warning'; // 6 hours or less
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  const urgencyColors = {
    critical: {
      bg: 'bg-red-50 border-red-300',
      text: 'text-red-700',
      number: 'text-red-800',
      pulse: 'animate-pulse',
    },
    warning: {
      bg: 'bg-orange-50 border-orange-300',
      text: 'text-orange-700',
      number: 'text-orange-800',
      pulse: '',
    },
    normal: {
      bg: 'bg-blue-50 border-blue-300',
      text: 'text-blue-700',
      number: 'text-blue-800',
      pulse: '',
    },
  };

  const colors = urgencyColors[urgency];

  return (
    <div className={`${classes.container} ${className}`}>
      {showLabel && (
        <div className={`${colors.text} font-medium mb-2 text-center`}>
          Claim expires in:
        </div>
      )}
      
      <div className={`${colors.bg} border rounded-lg p-4 ${colors.pulse}`}>
        <div className="flex justify-center items-center space-x-4">
          {/* Hours */}
          <div className="text-center">
            <div className={`${colors.number} ${classes.number}`}>
              {hours.toString().padStart(2, '0')}
            </div>
            {showLabel && (
              <div className={`${colors.text} ${classes.label}`}>
                Hours
              </div>
            )}
          </div>
          
          <div className={`${colors.number} ${classes.number}`}>:</div>
          
          {/* Minutes */}
          <div className="text-center">
            <div className={`${colors.number} ${classes.number}`}>
              {minutes.toString().padStart(2, '0')}
            </div>
            {showLabel && (
              <div className={`${colors.text} ${classes.label}`}>
                Minutes
              </div>
            )}
          </div>
          
          <div className={`${colors.number} ${classes.number}`}>:</div>
          
          {/* Seconds */}
          <div className="text-center">
            <div className={`${colors.number} ${classes.number}`}>
              {seconds.toString().padStart(2, '0')}
            </div>
            {showLabel && (
              <div className={`${colors.text} ${classes.label}`}>
                Seconds
              </div>
            )}
          </div>
        </div>
        
        {/* Urgency message */}
        {urgency === 'critical' && (
          <div className="text-center mt-2 text-red-600 text-sm font-medium">
            🚨 Critical: Complete your claim soon!
          </div>
        )}
        
        {urgency === 'warning' && (
          <div className="text-center mt-2 text-orange-600 text-sm">
            ⚠️ Less than 6 hours remaining
          </div>
        )}
      </div>
      
      {/* Claim info */}
      <div className="text-center mt-2 text-xs text-gray-500">
        Expires at: {new Date(claim.expiresAt).toLocaleString()}
      </div>
    </div>
  );
}