// My Claims page - User dashboard for managing claims
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ClaimHistory } from '@/components/claims/ClaimHistory';
import { ClaimStatus } from '@/components/claims/ClaimStatus';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { Claim } from '@/types/drops';
import {
  useClaimStore,
  useClaimLoading,
  useClaimError,
} from '@/store/claimStore';

export default function MyClaimsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history'>('overview');
  
  const {
    fetchClaims,
    refreshClaims,
    totalCount,
    lastFetchTime,
  } = useClaimStore();

  // Memoize filtered claims to prevent unnecessary re-renders
  const claimsMap = useClaimStore(state => state.claims);
  const allClaims = useMemo(() => Array.from(claimsMap.values()), [claimsMap]);
  
  // Helper function to normalize status for comparison
  const normalizeStatus = (status: string) => status.toLowerCase();
  
  const pendingClaims = useMemo(() => allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === 'pending'), [allClaims]);
  const completedClaims = useMemo(() => allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === 'completed'), [allClaims]);
  const expiredClaims = useMemo(() => allClaims.filter((claim: Claim) => normalizeStatus(claim.status) === 'expired'), [allClaims]);

  const isLoading = useClaimLoading('fetching');
  const fetchError = useClaimError('fetching');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  // Load claims on component mount
  useEffect(() => {
    if (session) {
      fetchClaims({ limit: 50 });
    }
  }, [session, fetchClaims]);

  // Auto-refresh claims every 5 minutes
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      refreshClaims();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [session, refreshClaims]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Claims</h1>
              <p className="mt-2 text-gray-600">
                Manage your drop claims and view claim history
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {lastFetchTime && (
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
                </div>
              )}
              
              <Button
                onClick={refreshClaims}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Claims</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingClaims.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedClaims.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredClaims.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'active', label: 'Active Claims', icon: '⏳' },
              { key: 'history', label: 'All History', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Claims Overview</h2>
              
              {/* Active Claims Section */}
              {pendingClaims.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🔥 Urgent: Active Claims Requiring Action
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Important:</strong> You have {pendingClaims.length} active claim(s) that will expire soon. 
                      Complete them before they expire to secure your drops.
                    </p>
                  </div>
                  <ClaimHistory
                    statusFilter="pending"
                    limit={5}
                    showTitle={false}
                    className="mb-6"
                  />
                </div>
              )}

              {/* Recent Activity */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <ClaimHistory
                  limit={5}
                  showTitle={false}
                  compact
                />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Success Rate</h4>
                  <div className="space-y-2">
                    {totalCount > 0 ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Completed Claims:</span>
                          <span className="font-medium">{Math.round((completedClaims.length / totalCount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(completedClaims.length / totalCount) * 100}%` }}
                          ></div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No claims yet</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Complete claims within 24 hours</li>
                    <li>• Check back regularly for new drops</li>
                    <li>• Join waitlists early for better positions</li>
                    <li>• Set reminders for claim deadlines</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="p-6">
              <ClaimHistory
                statusFilter="pending"
                showTitle={true}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <ClaimHistory
                showTitle={true}
                limit={20}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}