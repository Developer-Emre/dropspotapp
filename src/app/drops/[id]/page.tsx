'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { dropApi, isApiError, dropUtils } from '@/lib/dropApi';
import { Drop } from '@/types/drops';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function DropDetailPage() {
  const params = useParams();
  const dropId = params.id as string;
  
  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [phase, setPhase] = useState<any>(null);

  useEffect(() => {
    if (dropId) {
      loadDrop();
    }
  }, [dropId]);

  useEffect(() => {
    if (!drop) return;

    const updateCountdown = () => {
      const newPhase = dropUtils.calculatePhase(drop);
      setPhase(newPhase);
      
      if (newPhase.timeRemaining) {
        const formatted = dropUtils.formatTimeRemaining(newPhase.timeRemaining);
        setTimeRemaining(formatted.formatted);
      } else {
        setTimeRemaining('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [drop]);

  const loadDrop = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dropApi.getDropById(dropId);
      
      if (isApiError(response)) {
        setError(response.error.message);
        return;
      }
      
      setDrop(response.data);
    } catch (err) {
      setError('Failed to load drop details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseInfo = () => {
    if (!phase) return null;
    
    const color = dropUtils.getPhaseColor(phase.current);
    const text = dropUtils.getPhaseDisplayText(phase.current);
    
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return {
      text,
      className: colorClasses[color as keyof typeof colorClasses] || colorClasses.gray,
    };
  };

  const phaseInfo = getPhaseInfo();

  const handleWaitlistJoin = () => {
    console.log('Join waitlist for', dropId);
    // TODO: Implement waitlist join
  };

  const handleClaim = () => {
    console.log('Claim drop', dropId);
    // TODO: Implement claim functionality
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorMessage 
            message={error || 'Drop not found'} 
            onRetry={loadDrop}
          />
        </div>
      </div>
    );
  }

  const canJoinWaitlist = dropUtils.canJoinWaitlist(drop);
  const canClaim = dropUtils.canClaim(drop);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden">
              {drop.imageUrl ? (
                <img 
                  src={drop.imageUrl} 
                  alt={drop.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-gray-400">
                    <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-900">{drop.availableStock}</div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-900">{drop.waitlistCount}</div>
                <div className="text-sm text-gray-500">Waitlisted</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-900">{drop.claimedStock}</div>
                <div className="text-sm text-gray-500">Claimed</div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{drop.title}</h1>
                {phaseInfo && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${phaseInfo.className}`}>
                    {phaseInfo.text}
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                {drop.description}
              </p>
            </div>

            {/* Countdown */}
            {timeRemaining && phase && (
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="text-sm text-gray-500 mb-2">
                  {phase.current === 'upcoming' && '🚀 Launching in:'}
                  {phase.current === 'waitlist' && '⏰ Claiming starts in:'}
                  {phase.current === 'claiming' && '⚡ Ends in:'}
                </div>
                <div className="text-3xl font-mono font-bold text-gray-900">
                  {timeRemaining}
                </div>
              </div>
            )}

            {/* Drop Schedule */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Drop Schedule</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Waitlist Opens:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(drop.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Claiming Opens:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(drop.claimWindowStart).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Drop Ends:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(drop.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Required</h3>
              
              {/* Waitlist Phase */}
              {phase?.current === 'waitlist' && canJoinWaitlist && (
                <div>
                  <p className="text-gray-600 mb-4">
                    Join the waitlist to be eligible for claiming when the window opens.
                  </p>
                  <button
                    onClick={handleWaitlistJoin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Join Waitlist
                  </button>
                </div>
              )}

              {/* Claiming Phase */}
              {phase?.current === 'claiming' && canClaim && (
                <div>
                  <p className="text-gray-600 mb-4">
                    The claiming window is now open! You have 24 hours to complete your claim.
                  </p>
                  <button
                    onClick={handleClaim}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Claim Now
                  </button>
                </div>
              )}

              {/* Upcoming Phase */}
              {phase?.current === 'upcoming' && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    This drop hasn't started yet. Check back when the waitlist opens!
                  </p>
                  <div className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium">
                    Coming Soon
                  </div>
                </div>
              )}

              {/* Ended Phase */}
              {phase?.current === 'ended' && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    This drop has ended. Check out other available drops!
                  </p>
                  <div className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium">
                    Drop Ended
                  </div>
                </div>
              )}
            </div>

            {/* Stock Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Stock:</span>
                  <span className="font-medium text-gray-900">{drop.totalStock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{drop.availableStock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Claimed:</span>
                  <span className="font-medium text-gray-900">{drop.claimedStock}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((drop.claimedStock / drop.totalStock) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(drop.claimedStock / drop.totalStock) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}