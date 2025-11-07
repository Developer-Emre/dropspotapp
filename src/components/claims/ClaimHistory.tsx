// ClaimHistory component for displaying user's claim history
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Claim, ClaimStatus } from '@/types/drops';
import { ClaimStatusBadge } from './ClaimStatus';
import { ClaimCountdown } from './ClaimCountdown';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import {
  useClaimStore,
  useClaimLoading,
  useClaimError,
} from '@/store/claimStore';

interface ClaimHistoryProps {
  className?: string;
  limit?: number;
  statusFilter?: ClaimStatus;
  showTitle?: boolean;
  compact?: boolean;
}

export function ClaimHistory({
  className = '',
  limit = 10,
  statusFilter,
  showTitle = true,
  compact = false,
}: ClaimHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<ClaimStatus | 'all'>('all');
  
  // Memoize store actions to prevent unnecessary re-renders
  const { fetchClaims, completeClaim, filters, updateFilters, hasMore, totalCount } = useClaimStore();

  // Get all claims using direct store selector with proper memoization
  const claimsMap = useClaimStore(state => state.claims);
  const allClaims = useMemo(() => Array.from(claimsMap.values()), [claimsMap]);
  
  // Helper function to normalize status for comparison
  const normalizeStatus = (status: string) => status.toLowerCase();
  
  const pendingClaims = useMemo(() => allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === 'pending'), [allClaims]);
  const completedClaims = useMemo(() => allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === 'completed'), [allClaims]);
  const expiredClaims = useMemo(() => allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === 'expired'), [allClaims]);

  const isLoading = useClaimLoading('fetching');
  const fetchError = useClaimError('fetching');

  // Get filtered claims with memoization
  const filteredClaims = useMemo(() => {
    const targetFilter = statusFilter || activeFilter;
    if (targetFilter === 'all') {
      return allClaims.slice(0, limit);
    }
    return allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === targetFilter).slice(0, limit);
  }, [allClaims, statusFilter, activeFilter, limit]);

  // Fetch claims on component mount
  useEffect(() => {
    fetchClaims({ limit, status: statusFilter });
  }, [fetchClaims, limit, statusFilter]);

  // Handle filter change
  const handleFilterChange = (status: ClaimStatus | 'all') => {
    setActiveFilter(status);
    updateFilters({
      status: status === 'all' ? undefined : status,
      offset: 0,
    });
    fetchClaims({ status: status === 'all' ? undefined : status, offset: 0 });
  };

  // Handle complete claim
  const handleCompleteClaim = async (claimId: string) => {
    await completeClaim(claimId);
  };

  // Load more claims
  const handleLoadMore = () => {
    fetchClaims({ offset: allClaims.length }, true);
  };

  if (isLoading && allClaims.length === 0) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading claims...</span>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Title and Stats */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            My Claims
            <span className="ml-2 text-sm text-gray-500">
              ({totalCount} total)
            </span>
          </h2>
          
          {!compact && (
            <div className="flex space-x-2 text-xs">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {pendingClaims.length} Pending
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {completedClaims.length} Completed
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                {expiredClaims.length} Expired
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs (only if not using statusFilter prop) */}
      {!statusFilter && !compact && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key as ClaimStatus | 'all')}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${activeFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>Error:</strong> {fetchError}
          </div>
        </div>
      )}

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <div className="text-lg font-medium">No claims found</div>
          <div className="text-sm">
            {activeFilter === 'all' 
              ? "You haven't made any claims yet"
              : `No ${activeFilter} claims found`
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim: Claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              compact={compact}
              onCompleteClaim={handleCompleteClaim}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && allClaims.length >= limit && (
        <div className="text-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More Claims'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Individual claim card component
interface ClaimCardProps {
  claim: Claim;
  compact?: boolean;
  onCompleteClaim?: (claimId: string) => void;
}

function ClaimCard({ claim, compact = false, onCompleteClaim }: ClaimCardProps) {
  const isCompleting = useClaimLoading('completing', claim.id);
  const completeError = useClaimError('completing', claim.id);
  const [copied, setCopied] = useState(false);

  // Copy claim code to clipboard
  const copyClaimCode = async () => {
    try {
      await navigator.clipboard.writeText(claim.claimCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy claim code:', err);
    }
  };

  return (
    <div className={`
      border rounded-lg p-4 bg-white hover:shadow-md transition-shadow
      ${claim.status === 'expired' ? 'border-red-200 bg-red-50' : ''}
      ${claim.status === 'completed' ? 'border-green-200 bg-green-50' : ''}
      ${claim.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Drop Information */}
          {claim.drop && !compact && (
            <div className="mb-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-start space-x-3">
                {claim.drop.imageUrl && (
                  <img 
                    src={claim.drop.imageUrl} 
                    alt={claim.drop.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {claim.drop.title}
                  </h3>
                  {claim.drop.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {claim.drop.description.length > 100 
                        ? `${claim.drop.description.substring(0, 100)}...`
                        : claim.drop.description
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <ClaimStatusBadge status={claim.status} />
            
            {compact && claim.drop && (
              <div className="text-sm text-gray-600 truncate">
                {claim.drop.title}
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            {/* Copyable Claim Code */}
            <div className="flex items-center space-x-2">
              <span>Claim Code:</span>
              <div className="flex items-center space-x-1">
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {claim.claimCode}
                </span>
                <button
                  onClick={copyClaimCode}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Copy claim code"
                >
                  {copied ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span>📋</span>
                  )}
                </button>
              </div>
            </div>
            
            <div>Created: {new Date(claim.createdAt).toLocaleString()}</div>
            
            {claim.status === 'pending' && (
              <div>Expires: {new Date(claim.expiresAt).toLocaleString()}</div>
            )}
            
            {claim.status === 'completed' && claim.completedAt && (
              <div>Completed: {new Date(claim.completedAt).toLocaleString()}</div>
            )}
          </div>

          {/* Error message for completion */}
          {completeError && (
            <div className="mt-2 text-sm text-red-600 bg-red-100 border border-red-200 rounded p-2">
              Error: {completeError}
            </div>
          )}
        </div>

        {/* Actions and Countdown */}
        <div className="flex-shrink-0 ml-4">
          {claim.status === 'pending' && (
            <div className="space-y-3">
              {/* Countdown */}
              <ClaimCountdown
                claim={claim}
                size="sm"
                showLabel={false}
                className="text-center"
              />
              
              {/* Complete Button */}
              <Button
                onClick={() => onCompleteClaim?.(claim.id)}
                disabled={isCompleting}
                size="sm"
                variant="primary"
              >
                {isCompleting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    Completing...
                  </>
                ) : (
                  'Complete Claim'
                )}
              </Button>
            </div>
          )}
          
          {claim.status === 'completed' && (
            <div className="text-green-600 font-medium text-sm">
              ✅ Completed
            </div>
          )}
          
          {claim.status === 'expired' && (
            <div className="text-red-600 font-medium text-sm">
              ❌ Expired
            </div>
          )}
        </div>
      </div>
    </div>
  );
}