'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Drop } from '@/types/drops';
import { dropUtils } from '@/lib/dropApi';

interface DropCardProps {
  drop: Drop;
  onJoinWaitlist?: (dropId: string) => void;
  onLeaveWaitlist?: (dropId: string) => void;
  userWaitlistStatus?: {
    isJoined: boolean;
    position?: number;
  };
}

export default function DropCard({ 
  drop, 
  onJoinWaitlist, 
  onLeaveWaitlist, 
  userWaitlistStatus 
}: DropCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [phase, setPhase] = useState(dropUtils.calculatePhase(drop));

  useEffect(() => {
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

  const getPhaseInfo = () => {
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

  const handleWaitlistAction = () => {
    if (userWaitlistStatus?.isJoined) {
      onLeaveWaitlist?.(drop.id);
    } else {
      onJoinWaitlist?.(drop.id);
    }
  };

  const canJoinWaitlist = dropUtils.canJoinWaitlist(drop);
  const canClaim = dropUtils.canClaim(drop);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {drop.imageUrl ? (
          <img 
            src={drop.imageUrl} 
            alt={drop.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
              {drop.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {drop.description}
            </p>
          </div>
          <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium border ${phaseInfo.className}`}>
            {phaseInfo.text}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Stock:</span>
            <span className="ml-1 font-medium text-gray-900">
              {drop.availableStock}/{drop.totalStock}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Waitlist:</span>
            <span className="ml-1 font-medium text-gray-900">
              {drop.waitlistCount}
            </span>
          </div>
        </div>

        {/* Countdown */}
        {timeRemaining && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">
              {phase.current === 'upcoming' && 'Starts in:'}
              {phase.current === 'waitlist' && 'Claiming starts in:'}
              {phase.current === 'claiming' && 'Ends in:'}
            </div>
            <div className="text-lg font-mono font-bold text-gray-900">
              {timeRemaining}
            </div>
          </div>
        )}

        {/* Waitlist Status */}
        {userWaitlistStatus?.isJoined && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              ✓ Joined waitlist
              {userWaitlistStatus.position && (
                <span className="ml-2 font-medium">
                  Position #{userWaitlistStatus.position}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {/* Primary Action Button */}
          {phase.current === 'waitlist' && canJoinWaitlist && (
            <button
              onClick={handleWaitlistAction}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                userWaitlistStatus?.isJoined
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {userWaitlistStatus?.isJoined ? 'Leave Waitlist' : 'Join Waitlist'}
            </button>
          )}
          
          {phase.current === 'claiming' && canClaim && (
            <Link
              href={`/drops/${drop.id}`}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm text-center transition-colors"
            >
              Claim Now
            </Link>
          )}

          {phase.current === 'upcoming' && (
            <button
              disabled
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-500 rounded-md font-medium text-sm cursor-not-allowed"
            >
              Coming Soon
            </button>
          )}

          {phase.current === 'ended' && (
            <button
              disabled
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-500 rounded-md font-medium text-sm cursor-not-allowed"
            >
              Ended
            </button>
          )}

          {/* View Details Button */}
          <Link
            href={`/drops/${drop.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium text-sm transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}