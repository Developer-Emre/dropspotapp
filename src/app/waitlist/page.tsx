'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { dropApi, isApiError, dropUtils } from '@/lib/dropApi';
import { Drop } from '@/types/drops';
import WaitlistPositionTracker from '@/components/drops/WaitlistPositionTracker';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface WaitlistEntry {
  drop: Drop;
  position: number;
  totalWaiting?: number;
  joinedAt: string;
  priorityScore?: number;
  canClaim?: boolean;
  estimatedClaimTime?: string;
}

interface WaitlistSummary {
  totalActive: number;
  totalClaimable: number;
  totalCompleted: number;
}

export default function WaitlistDashboard() {
  const { data: session, status } = useSession();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [waitlistSummary, setWaitlistSummary] = useState<WaitlistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Development mode mock session for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const mockSession = isDevelopment ? {
    user: {
      id: 'dev-user-1',
      email: 'dev@test.com',
      name: 'Dev User'
    }
  } : null;

  // Use real session or fallback to mock in development
  const effectiveSession = session || mockSession;
  const effectiveStatus = session ? status : (mockSession ? 'authenticated' : status);

  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Session status:', effectiveStatus);
      console.log('Session data:', effectiveSession);
      console.log('Is development:', isDevelopment);
    }
    
    if (effectiveStatus === 'authenticated' && effectiveSession?.user) {
      loadWaitlistEntries();
    } else if (effectiveStatus === 'unauthenticated') {
      setLoading(false);
    }
    // Keep loading for 'loading' status
  }, [effectiveStatus, effectiveSession]);

  const loadWaitlistEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the centralized auth utilities to get user data
      // Remove debug logging for production
      
      // Use the new getUserWaitlists endpoint instead of checking each drop individually
      const waitlistsResponse = await dropApi.getUserWaitlists();
      if (isApiError(waitlistsResponse)) {
        setError(waitlistsResponse.error.message);
        return;
      }

      // Transform backend response to frontend format
      const transformedEntries: WaitlistEntry[] = waitlistsResponse.data.waitlists.map((item: any) => {
        const drop = {
          id: item.drop.id,
          title: item.drop.title,
          description: item.drop.description || '',
          imageUrl: '/api/placeholder/400/300', // Placeholder since not in response
          totalStock: item.drop.totalStock,
          claimedStock: item.drop.claimedStock,
          startDate: item.drop.startDate,
          endDate: item.drop.endDate,
          claimWindowStart: item.drop.claimWindowStart,
          claimWindowEnd: item.drop.claimWindowEnd,
          createdAt: item.drop.createdAt,
          availableStock: item.drop.totalStock - item.drop.claimedStock,
          waitlistCount: 0, // Not provided in response
          status: 'waitlist' as any // We'll calculate this properly
        };
        
        // Calculate the actual drop status
        const phase = dropUtils.calculatePhase(drop);
        drop.status = phase.current as any;
        
        return {
          drop,
          position: item.position,
          totalWaiting: 0, // Could be calculated from pagination.total if needed
          joinedAt: item.joinedAt,
          priorityScore: item.priorityScore,
          canClaim: item.canClaim,
          estimatedClaimTime: item.estimatedClaimTime
        };
      });

      setWaitlistEntries(transformedEntries);
      
      // Set summary from backend response
      if (waitlistsResponse.data.summary) {
        setWaitlistSummary(waitlistsResponse.data.summary);
      }
    } catch (err) {
      setError('Failed to load waitlist entries');
      console.error('Waitlist dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (effectiveStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (effectiveStatus === 'unauthenticated' || !effectiveSession?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your waitlist dashboard.
            </p>
            <Link 
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Waitlist
          </h1>
          <p className="text-gray-600">
            Track your position and status across all drop waitlists
          </p>
          {isDevelopment && (
            <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
              Development Mode - Mock Session Active
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage 
              message={error} 
              onRetry={loadWaitlistEntries}
            />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {waitlistSummary?.totalActive || waitlistEntries.length}
            </div>
            <div className="text-sm text-gray-500">Active Waitlists</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {waitlistSummary?.totalClaimable || waitlistEntries.filter(entry => entry.canClaim).length}
            </div>
            <div className="text-sm text-gray-500">Ready to Claim</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {waitlistSummary?.totalCompleted || 0}
            </div>
            <div className="text-sm text-gray-500">Completed Claims</div>
          </div>
        </div>

        {/* Waitlist Entries */}
        {waitlistEntries.length > 0 ? (
          <div className="space-y-6">
            {waitlistEntries.map(entry => {
              const phase = dropUtils.calculatePhase(entry.drop);
              
              return (
                <div key={entry.drop.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {entry.drop.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {entry.drop.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          Joined: {new Date(entry.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          phase.current === 'waitlist' ? 'bg-yellow-100 text-yellow-800' :
                          phase.current === 'claiming' ? 'bg-green-100 text-green-800' :
                          phase.current === 'ended' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {dropUtils.getPhaseDisplayText(phase.current)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Drop Info */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Available Stock:</span>
                          <span className="font-medium text-gray-900">
                            {entry.drop.availableStock}/{entry.drop.totalStock}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Position:</span>
                          <span className="font-medium text-gray-900">
                            #{entry.position}
                          </span>
                        </div>

                        {entry.priorityScore && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Priority Score:</span>
                            <span className="font-medium text-blue-600">
                              {entry.priorityScore}
                            </span>
                          </div>
                        )}

                        {entry.canClaim !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Can Claim:</span>
                            <span className={`font-medium ${entry.canClaim ? 'text-green-600' : 'text-gray-600'}`}>
                              {entry.canClaim ? 'Yes' : 'Not Yet'}
                            </span>
                          </div>
                        )}

                        {entry.estimatedClaimTime && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Estimated Claim:</span>
                            <span className="font-medium text-purple-600">
                              {new Date(entry.estimatedClaimTime).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Link
                            href={`/drops/${entry.drop.id}`}
                            className="flex-1 text-center py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium"
                          >
                            View Drop
                          </Link>
                          {entry.canClaim && (
                            <Link
                              href={`/drops/${entry.drop.id}`}
                              className="flex-1 text-center py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                            >
                              Claim Now
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Position Tracker */}
                      <div>
                        <WaitlistPositionTracker 
                          dropId={entry.drop.id}
                          pollingInterval={45000} // 45 seconds for dashboard
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Active Waitlists
            </h3>
            <p className="text-gray-500 mb-4">
              You haven't joined any drop waitlists yet.
            </p>
            <Link
              href="/drops"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Drops
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}