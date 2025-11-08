'use client';

import { useState, useEffect } from 'react';
import { dropApi, isApiError, dropUtils } from '@/lib/dropApi';
import { Drop } from '@/types/drops';
import DropCard from '@/components/drops/DropCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { errorHandler } from '@/lib/errorHandler';
import { ApiError } from '@/types/errors';

export default function DropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'waitlist' | 'claiming' | 'ended'>('all');

  useEffect(() => {
    loadDrops();
  }, []);

  const loadDrops = async () => {
    try {
      setLoading(true);
      
      const response = await dropApi.getDrops();
      
      if (isApiError(response)) {
        const apiError: ApiError = {
          success: false,
          message: response.error.message,
          status: 400
        };
        errorHandler.handleError(apiError, 'drop_fetch');
        return;
      }
      
      setDrops(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drops';
      errorHandler.handleError(new Error(errorMessage), 'drop_fetch');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrops = drops.filter(drop => {
    if (filter === 'all') return true;
    const phase = dropUtils.calculatePhase(drop);
    return phase.current === filter;
  });

  const getFilterCounts = () => {
    const counts = {
      all: drops.length,
      upcoming: 0,
      waitlist: 0,
      claiming: 0,
      ended: 0,
    };

    drops.forEach(drop => {
      const phase = dropUtils.calculatePhase(drop);
      counts[phase.current as keyof typeof counts]++;
    });

    return counts;
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Drops
          </h1>
          <p className="text-gray-600">
            Discover and join exclusive product drops
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Drops', count: counts.all },
                { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                { key: 'waitlist', label: 'Waitlist Open', count: counts.waitlist },
                { key: 'claiming', label: 'Claiming', count: counts.claiming },
                { key: 'ended', label: 'Ended', count: counts.ended },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Drops Grid */}
        {filteredDrops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrops.map(drop => (
              <DropCard 
                key={drop.id} 
                drop={drop}
                onJoinWaitlist={(dropId) => {
                  console.log('✅ Joined waitlist for', dropId);
                  // Optionally reload drops to refresh counts
                  setTimeout(() => loadDrops(), 1000);
                }}
                onLeaveWaitlist={(dropId) => {
                  console.log('❌ Left waitlist for', dropId);
                  // Optionally reload drops to refresh counts
                  setTimeout(() => loadDrops(), 1000);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-6V4a1 1 0 00-1-1H6a1 1 0 00-1 1v3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No drops found
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No drops are currently available.'
                : `No drops are currently in the "${filter}" phase.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}