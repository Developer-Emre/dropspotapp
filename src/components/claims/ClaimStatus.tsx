// ClaimStatus component for displaying claim status
'use client';

import { Claim, ClaimStatus as ClaimStatusType } from '@/types/drops';

interface ClaimStatusProps {
  claim: Claim;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function ClaimStatus({
  claim,
  className = '',
  size = 'md',
  showDetails = false,
}: ClaimStatusProps) {
  
  // Normalize status to lowercase to handle API case mismatch
  const normalizeStatus = (status: string): ClaimStatusType => {
    return status.toLowerCase() as ClaimStatusType;
  };
  
  const getStatusConfig = (status: ClaimStatusType) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'pending':
        return {
          label: 'Pending',
          emoji: '⏳',
          bgColor: 'bg-yellow-100 border-yellow-300',
          textColor: 'text-yellow-800',
          description: 'Claim is active and waiting to be completed',
          action: 'Complete your claim before it expires',
        };
      case 'completed':
        return {
          label: 'Completed',
          emoji: '✅',
          bgColor: 'bg-green-100 border-green-300',
          textColor: 'text-green-800',
          description: 'Claim has been successfully completed',
          action: 'Your drop has been secured',
        };
      case 'expired':
        return {
          label: 'Expired',
          emoji: '❌',
          bgColor: 'bg-red-100 border-red-300',
          textColor: 'text-red-800',
          description: 'Claim has expired and is no longer valid',
          action: 'This claim cannot be completed',
        };
      default:
        return {
          label: 'Unknown',
          emoji: '❓',
          bgColor: 'bg-gray-100 border-gray-300',
          textColor: 'text-gray-800',
          description: 'Unknown claim status',
          action: '',
        };
    }
  };

  const statusConfig = getStatusConfig(claim.status);

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-xs px-2 py-1',
      emoji: 'text-sm',
      badge: 'text-xs px-2 py-1',
      details: 'text-xs mt-1',
    },
    md: {
      container: 'text-sm px-3 py-2',
      emoji: 'text-base',
      badge: 'text-sm px-3 py-1',
      details: 'text-sm mt-2',
    },
    lg: {
      container: 'text-base px-4 py-3',
      emoji: 'text-lg',
      badge: 'text-base px-4 py-2',
      details: 'text-base mt-3',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${className}`}>
      {/* Status Badge */}
      <div className={`
        inline-flex items-center rounded-full border
        ${statusConfig.bgColor} ${statusConfig.textColor} ${classes.badge}
      `}>
        <span className={`mr-2 ${classes.emoji}`}>{statusConfig.emoji}</span>
        <span className="font-medium">{statusConfig.label}</span>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className={`${classes.details} space-y-2`}>
          {/* Description */}
          <div className={`${statusConfig.textColor}`}>
            {statusConfig.description}
          </div>

          {/* Action/Next Steps */}
          {statusConfig.action && (
            <div className={`text-gray-600 italic`}>
              {statusConfig.action}
            </div>
          )}

          {/* Claim Details */}
          <div className="text-gray-500 text-xs space-y-1">
            <div>
              <strong>Claim ID:</strong> {claim.id}
            </div>
            <div>
              <strong>Claim Code:</strong> {claim.claimCode}
            </div>
            <div>
              <strong>Created:</strong> {new Date(claim.createdAt).toLocaleString()}
            </div>
            
            {normalizeStatus(claim.status) === 'pending' && (
              <div>
                <strong>Expires:</strong> {new Date(claim.expiresAt).toLocaleString()}
              </div>
            )}
            
            {normalizeStatus(claim.status) === 'completed' && claim.completedAt && (
              <div>
                <strong>Completed:</strong> {new Date(claim.completedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact status component for lists
export function ClaimStatusBadge({
  status,
  className = '',
}: {
  status: ClaimStatusType;
  className?: string;
}) {
  // Debug log to see what status value we're getting
  if (process.env.NODE_ENV === 'development') {
    console.log('ClaimStatusBadge received status:', status, 'type:', typeof status);
  }
  
  // Normalize status to lowercase to handle API case mismatch
  const normalizedStatus = status.toLowerCase() as ClaimStatusType;
  
  const statusConfig = {
    pending: {
      emoji: '⏳',
      label: 'Pending',
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    completed: {
      emoji: '✅',
      label: 'Completed',
      colors: 'bg-green-100 text-green-800 border-green-300',
    },
    expired: {
      emoji: '❌',
      label: 'Expired',
      colors: 'bg-red-100 text-red-800 border-red-300',
    },
  }[normalizedStatus] || {
    emoji: '❓',
    label: 'Unknown',
    colors: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
      ${statusConfig.colors} ${className}
    `}>
      <span className="mr-1">{statusConfig.emoji}</span>
      {statusConfig.label}
    </span>
  );
}