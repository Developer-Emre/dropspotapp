'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { dropApi, isApiError } from '@/lib/dropApi';
import { mockCalculatePriorityScore } from '@/lib/priorityScore';
import { logError } from '@/lib/logger';

interface WaitlistPositionTrackerProps {
  dropId: string;
  onPositionUpdate?: (position: number | null, total: number) => void;
  pollingInterval?: number; // milliseconds
}

interface PositionData {
  position: number | null;
  totalWaiting: number;
  priorityScore?: number;
  estimatedClaimChance?: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

export default function WaitlistPositionTracker({ 
  dropId, 
  onPositionUpdate, 
  pollingInterval = 30000 // 30 seconds default
}: WaitlistPositionTrackerProps) {
  const { data: session } = useSession();
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const updatePosition = useCallback(async () => {
    if (!session?.user || !dropId) return;

    try {
      const response = await dropApi.getWaitlistStatus(dropId);
      
      if (response && 'success' in response && response.success && response.data) {
        const { data } = response;
        
        if (data.inWaitlist && data.position && data.entry) {
          const positionData: PositionData = {
            position: data.position,
            totalWaiting: 0, // Bu endpoint'te total waiting bilgisi yok
            priorityScore: data.entry.priorityScore,
            estimatedClaimChance: undefined, // Bu endpoint'te chance bilgisi yok
            lastUpdated: new Date()
          };
          
          setPositionData(positionData);
          onPositionUpdate?.(data.position, 0);
        } else {
          setPositionData(null);
          onPositionUpdate?.(null, 0);
        }
      } else {
        setPositionData(null);
        onPositionUpdate?.(null, 0);
      }
    } catch (err) {
      logError('Position tracking error', err);
      setError('Failed to update position');
    }
  }, [session, dropId]); // onPositionUpdate'i dependency'den çıkardık

  // Start/stop polling based on session and component mount
  useEffect(() => {
    if (!session?.user) {
      setIsPolling(false);
      setPositionData(null);
      return;
    }

    setIsPolling(true);
    
    // Immediate update
    updatePosition();

    // Set up polling interval
    const interval = setInterval(updatePosition, pollingInterval);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [session, updatePosition, pollingInterval]);

  // Don't render anything if not in waitlist
  if (!positionData) return null;

  const getChanceColor = (chance?: string) => {
    switch (chance) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChanceText = (chance?: string) => {
    switch (chance) {
      case 'high': return 'High chance';
      case 'medium': return 'Medium chance';
      case 'low': return 'Low chance';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-900">
          Waitlist Status
        </h3>
        <div className="flex items-center text-xs text-blue-600">
          <div className={`w-2 h-2 rounded-full mr-1 ${isPolling ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          Live
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-blue-600 mb-1">Your Position</div>
          <div className="text-lg font-bold text-blue-900">
            {positionData.position ? `#${positionData.position}` : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-xs text-blue-600 mb-1">Status</div>
          <div className="text-lg font-bold text-blue-900">
            Active
          </div>
        </div>
      </div>

      {positionData.priorityScore && (
        <div className="mb-3">
          <div className="text-xs text-blue-600 mb-1">Priority Score</div>
          <div className="text-sm font-medium text-blue-900">
            {positionData.priorityScore.toFixed(1)}
          </div>
        </div>
      )}

      {positionData.estimatedClaimChance && (
        <div className="mb-3">
          <div className="text-xs text-blue-600 mb-1">Claim Chance</div>
          <div className={`text-sm font-medium ${getChanceColor(positionData.estimatedClaimChance)}`}>
            {getChanceText(positionData.estimatedClaimChance)}
          </div>
        </div>
      )}

      <div className="text-xs text-blue-500">
        Updated: {positionData.lastUpdated.toLocaleTimeString()}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}