// Zustand store for waitlist state management
// More efficient than React Context for frequent updates

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { dropApi, isApiError } from '@/lib/dropApi';

export interface WaitlistEntry {
  dropId: string;
  position: number;
  totalWaiting: number;
  priorityScore: number;
  joinedAt: string;
  estimatedClaimChance: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

interface WaitlistState {
  // State
  entries: Record<string, WaitlistEntry>; // dropId -> WaitlistEntry
  isLoading: Record<string, boolean>; // dropId -> loading state
  errors: Record<string, string | null>; // dropId -> error message
  
  // Computed values
  joinedDropIds: string[];
  totalJoinedCount: number;
  
  // Actions
  joinWaitlist: (dropId: string) => Promise<boolean>;
  leaveWaitlist: (dropId: string) => Promise<boolean>;
  checkWaitlistStatus: (dropId: string) => Promise<void>;
  updatePosition: (dropId: string, position: number, total: number) => void;
  setLoading: (dropId: string, loading: boolean) => void;
  setError: (dropId: string, error: string | null) => void;
  clearError: (dropId: string) => void;
  clearAllErrors: () => void;
  resetStore: () => void;
}

const initialState = {
  entries: {},
  isLoading: {},
  errors: {},
  joinedDropIds: [],
  totalJoinedCount: 0,
};

export const useWaitlistStore = create<WaitlistState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Actions
    joinWaitlist: async (dropId: string): Promise<boolean> => {
      set((state) => ({
        isLoading: { ...state.isLoading, [dropId]: true },
        errors: { ...state.errors, [dropId]: null },
      }));

      try {
        const response = await dropApi.joinWaitlist(dropId);

        if (isApiError(response)) {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : response.error.message || 'Unknown error occurred';
            
          set((state) => ({
            errors: { ...state.errors, [dropId]: errorMessage },
            isLoading: { ...state.isLoading, [dropId]: false },
          }));
          return false;
        }

        // Update store with successful join
        if (response.data.waitlistEntry) {
          const entry: WaitlistEntry = {
            dropId,
            position: response.data.waitlistEntry.position,
            totalWaiting: 0, // Will be updated by position tracker
            priorityScore: response.data.waitlistEntry.priorityScore,
            joinedAt: response.data.waitlistEntry.joinedAt,
            estimatedClaimChance: 'medium', // Default, will be calculated
            lastUpdated: new Date(),
          };

          set((state) => {
            const newEntries = { ...state.entries, [dropId]: entry };
            return {
              entries: newEntries,
              joinedDropIds: Object.keys(newEntries),
              totalJoinedCount: Object.keys(newEntries).length,
              isLoading: { ...state.isLoading, [dropId]: false },
            };
          });
        }

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to join waitlist';
        set((state) => ({
          errors: { ...state.errors, [dropId]: errorMessage },
          isLoading: { ...state.isLoading, [dropId]: false },
        }));
        return false;
      }
    },

    leaveWaitlist: async (dropId: string): Promise<boolean> => {
      set((state) => ({
        isLoading: { ...state.isLoading, [dropId]: true },
        errors: { ...state.errors, [dropId]: null },
      }));

      try {
        const response = await dropApi.leaveWaitlist(dropId);

        if (isApiError(response)) {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : response.error.message || 'Unknown error occurred';
            
          set((state) => ({
            errors: { ...state.errors, [dropId]: errorMessage },
            isLoading: { ...state.isLoading, [dropId]: false },
          }));
          return false;
        }

        // Remove from store
        set((state) => {
          const newEntries = { ...state.entries };
          delete newEntries[dropId];
          
          return {
            entries: newEntries,
            joinedDropIds: Object.keys(newEntries),
            totalJoinedCount: Object.keys(newEntries).length,
            isLoading: { ...state.isLoading, [dropId]: false },
          };
        });

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to leave waitlist';
        set((state) => ({
          errors: { ...state.errors, [dropId]: errorMessage },
          isLoading: { ...state.isLoading, [dropId]: false },
        }));
        return false;
      }
    },

    checkWaitlistStatus: async (dropId: string): Promise<void> => {
      try {
        const response = await dropApi.getWaitlistStatus(dropId);

        if (isApiError(response)) {
          const errorCode = typeof response.error === 'string' ? null : response.error.code;
          if (errorCode !== 'NOT_IN_WAITLIST') {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : response.error.message || 'Unknown error occurred';
              
            set((state) => ({
              errors: { ...state.errors, [dropId]: errorMessage },
            }));
          }
          return;
        }

        if (response.data.inWaitlist && response.data.entry) {
          const entry: WaitlistEntry = {
            dropId,
            position: response.data.position || 0,
            totalWaiting: 0, // This endpoint doesn't provide total waiting
            priorityScore: response.data.entry.priorityScore || 0,
            joinedAt: response.data.entry.joinedAt || new Date().toISOString(),
            estimatedClaimChance: 'medium', // Will be calculated based on position
            lastUpdated: new Date(),
          };

          set((state) => {
            const newEntries = { ...state.entries, [dropId]: entry };
            return {
              entries: newEntries,
              joinedDropIds: Object.keys(newEntries),
              totalJoinedCount: Object.keys(newEntries).length,
            };
          });
        } else {
          // Not in waitlist, remove from store
          set((state) => {
            const newEntries = { ...state.entries };
            delete newEntries[dropId];
            
            return {
              entries: newEntries,
              joinedDropIds: Object.keys(newEntries),
              totalJoinedCount: Object.keys(newEntries).length,
            };
          });
        }
      } catch (error) {
        // Silent failure for waitlist status check - component will handle UI state
        // Only set error if it's a critical issue
        if (error instanceof Error && error.message.includes('network')) {
          set((state) => ({
            errors: { ...state.errors, [dropId]: 'Network error checking waitlist status' },
          }));
        }
      }
    },

    updatePosition: (dropId: string, position: number, total: number) => {
      set((state) => {
        const entry = state.entries[dropId];
        if (!entry) return state;

        const estimatedClaimChance: 'high' | 'medium' | 'low' = 
          position <= 50 ? 'high' : position <= 100 ? 'medium' : 'low';

        const updatedEntry: WaitlistEntry = {
          ...entry,
          position,
          totalWaiting: total,
          estimatedClaimChance,
          lastUpdated: new Date(),
        };

        return {
          entries: { ...state.entries, [dropId]: updatedEntry },
        };
      });
    },

    setLoading: (dropId: string, loading: boolean) => {
      set((state) => ({
        isLoading: { ...state.isLoading, [dropId]: loading },
      }));
    },

    setError: (dropId: string, error: string | null) => {
      set((state) => ({
        errors: { ...state.errors, [dropId]: error },
      }));
    },

    clearError: (dropId: string) => {
      set((state) => ({
        errors: { ...state.errors, [dropId]: null },
      }));
    },

    clearAllErrors: () => {
      set((state) => ({
        errors: Object.keys(state.errors).reduce((acc, key) => ({ ...acc, [key]: null }), {}),
      }));
    },

    resetStore: () => {
      set(initialState);
    },
  }))
);

// Selectors for better performance
export const useWaitlistEntry = (dropId: string) =>
  useWaitlistStore((state) => state.entries[dropId]);

export const useWaitlistLoading = (dropId: string) =>
  useWaitlistStore((state) => state.isLoading[dropId] || false);

export const useWaitlistError = (dropId: string) =>
  useWaitlistStore((state) => state.errors[dropId] || null);

export const useUserWaitlists = () =>
  useWaitlistStore((state) => ({
    entries: Object.values(state.entries),
    totalCount: state.totalJoinedCount,
    joinedDropIds: state.joinedDropIds,
  }));

// Individual action selectors (stable references)
export const useJoinWaitlist = () =>
  useWaitlistStore((state) => state.joinWaitlist);

export const useLeaveWaitlist = () =>
  useWaitlistStore((state) => state.leaveWaitlist);

export const useCheckWaitlistStatus = () =>
  useWaitlistStore((state) => state.checkWaitlistStatus);

export const useUpdatePosition = () =>
  useWaitlistStore((state) => state.updatePosition);

export const useClearWaitlistError = () =>
  useWaitlistStore((state) => state.clearError);

export const useResetWaitlistStore = () =>
  useWaitlistStore((state) => state.resetStore);

// Combined actions selector (use individual selectors above to avoid re-renders)
export const useWaitlistActions = () => {
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const checkWaitlistStatus = useCheckWaitlistStatus();
  const updatePosition = useUpdatePosition();
  const clearError = useClearWaitlistError();
  const resetStore = useResetWaitlistStore();
  
  return {
    joinWaitlist,
    leaveWaitlist,
    checkWaitlistStatus,
    updatePosition,
    clearError,
    resetStore,
  };
};