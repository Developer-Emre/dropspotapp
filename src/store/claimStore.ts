// Zustand store for claim state management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { dropApi, isApiError } from '@/lib/dropApi';
import { Claim, ClaimStatus } from '@/types/drops';
import { logUserAction, logError, logInfo, logDebug } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';
import type { ApiError } from '@/types/errors';

interface ClaimState {
  // Claims data
  claims: Map<string, Claim>;
  claimsByDrop: Map<string, string>; // dropId -> claimId mapping
  
  // Loading states
  loading: {
    claiming: Set<string>; // dropIds currently being claimed
    completing: Set<string>; // claimIds currently being completed
    fetching: boolean; // fetching claims list
  };
  
  // Error states
  errors: {
    claiming: Map<string, string>; // dropId -> error message
    completing: Map<string, string>; // claimId -> error message
    fetching: string | null;
  };
  
  // Pagination and filters
  filters: {
    status?: ClaimStatus;
    limit: number;
    offset: number;
  };
  
  totalCount: number;
  hasMore: boolean;
  lastFetchTime: number | null;
}

interface ClaimActions {
  // Claim operations
  claimDrop: (dropId: string) => Promise<boolean>;
  completeClaim: (claimId: string) => Promise<boolean>;
  
  // Data fetching
  fetchClaims: (filters?: Partial<ClaimState['filters']>, append?: boolean) => Promise<void>;
  fetchClaimStatus: (dropId: string) => Promise<Claim | null>;
  refreshClaims: () => Promise<void>;
  
  // State management
  clearError: (type: 'claiming' | 'completing' | 'fetching', id?: string) => void;
  updateFilters: (filters: Partial<ClaimState['filters']>) => void;
  resetFilters: () => void;
  
  // Optimistic updates
  optimisticClaimUpdate: (dropId: string, claim: Partial<Claim>) => void;
  revertOptimisticUpdate: (dropId: string) => void;
  
  // Cleanup
  clearAll: () => void;
}

type ClaimStore = ClaimState & ClaimActions;

const initialFilters: ClaimState['filters'] = {
  limit: 20,
  offset: 0,
};

const useClaimStore = create<ClaimStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    claims: new Map<string, Claim>(),
    claimsByDrop: new Map<string, string>(),
    loading: {
      claiming: new Set<string>(),
      completing: new Set<string>(),
      fetching: false,
    },
    errors: {
      claiming: new Map<string, string>(),
      completing: new Map<string, string>(),
      fetching: null,
    },
    filters: initialFilters,
    totalCount: 0,
    hasMore: true,
    lastFetchTime: null,

    // Claim a drop
    claimDrop: async (dropId: string) => {
      const { loading, errors, optimisticClaimUpdate, revertOptimisticUpdate } = get();
      
      // Prevent duplicate requests
      if (loading.claiming.has(dropId)) {
        return false;
      }

      // Clear previous errors
      const newClaimingErrors = new Map(errors.claiming);
      newClaimingErrors.delete(dropId);
      
      // Set loading state
      set(state => ({
        loading: {
          ...state.loading,
          claiming: new Set([...state.loading.claiming, dropId]),
        },
        errors: {
          ...state.errors,
          claiming: newClaimingErrors,
        },
      }));

      try {
        logUserAction('store_claim_drop_attempt', { dropId });
        
        // Optimistic update - create temporary claim
        const tempClaim: Partial<Claim> = {
          id: `temp-${Date.now()}`,
          dropId,
          status: 'pending' as ClaimStatus,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          createdAt: new Date().toISOString(),
        };
        
        optimisticClaimUpdate(dropId, tempClaim);

        const response = await dropApi.claimDrop(dropId);

        if (isApiError(response)) {
          revertOptimisticUpdate(dropId);
          
          // Safe error message extraction
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : response.error.message || 'Unknown error occurred';
          
          // Debug logging to check error format
          logDebug('Claim error received', { 
            message: errorMessage,
            fullResponse: response 
          });
          
          // Use central error handler instead of manual error mapping
          const apiErrorForHandler: ApiError = {
            success: false,
            message: errorMessage,
            status: 403, // Set correct status for waitlist errors
          };
          
          const errorActions = errorHandler.handleError(apiErrorForHandler, 'claim_drop');
          
          // Still store error in state for component access
          const userFriendlyMessage = errorHandler.createUserFriendlyMessage(apiErrorForHandler, 'claim_drop');
          
          set(state => ({
            errors: {
              ...state.errors,
              claiming: new Map([...state.errors.claiming, [dropId, userFriendlyMessage]]),
            },
          }));
          
          logError('Store claim drop failed', response.error);
          return false;
        }

        const claim = response.data.claim;
        if (claim) {
          // Debug claim data format
          logInfo('Claim data received from API', { claim });
          
          // Replace optimistic update with real data
          set(state => ({
            claims: new Map([...state.claims, [claim.id, claim]]),
            claimsByDrop: new Map([...state.claimsByDrop, [dropId, claim.id]]),
          }));

          logUserAction('store_claim_drop_success', {
            dropId,
            claimId: claim.id,
            expiresAt: claim.expiresAt,
          });
          return true;
        }

        revertOptimisticUpdate(dropId);
        set(state => ({
          errors: {
            ...state.errors,
            claiming: new Map([...state.errors.claiming, [dropId, 'No claim data received']]),
          },
        }));
        
        return false;

      } catch (error) {
        revertOptimisticUpdate(dropId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        set(state => ({
          errors: {
            ...state.errors,
            claiming: new Map([...state.errors.claiming, [dropId, errorMessage]]),
          },
        }));
        
        logError('Store claim drop exception', error);
        return false;
        
      } finally {
        // Clear loading state
        set(state => ({
          loading: {
            ...state.loading,
            claiming: new Set([...state.loading.claiming].filter(id => id !== dropId)),
          },
        }));
      }
    },

    // Complete a claim
    completeClaim: async (claimId: string) => {
      const { loading, errors, claims } = get();
      
      if (loading.completing.has(claimId)) {
        return false;
      }

      const claim = claims.get(claimId);
      if (!claim) {
        logError('Store complete claim failed', new Error('Claim not found'));
        return false;
      }
      if (!claim) {
        logError('Claim not found for completion', { claimId });
        return false;
      }

      // Clear previous errors
      const newCompletingErrors = new Map(errors.completing);
      newCompletingErrors.delete(claimId);
      
      set(state => ({
        loading: {
          ...state.loading,
          completing: new Set([...state.loading.completing, claimId]),
        },
        errors: {
          ...state.errors,
          completing: newCompletingErrors,
        },
      }));

      try {
        logUserAction('store_complete_claim_attempt', { claimId, dropId: claim.dropId });

        const response = await dropApi.completeClaim(claimId);

        if (isApiError(response)) {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : response.error.message || 'Unknown error occurred';
            
          set(state => ({
            errors: {
              ...state.errors,
              completing: new Map([...state.errors.completing, [claimId, errorMessage]]),
            },
          }));
          
          logError('Store complete claim failed', response.error);
          return false;
        }

        const updatedClaim = response.data.claim;
        if (updatedClaim) {
          set(state => ({
            claims: new Map([...state.claims, [claimId, updatedClaim]]),
          }));

          logUserAction('store_complete_claim_success', {
            claimId,
            dropId: claim.dropId,
            completedAt: updatedClaim.completedAt,
          });
          return true;
        }

        return false;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        set(state => ({
          errors: {
            ...state.errors,
            completing: new Map([...state.errors.completing, [claimId, errorMessage]]),
          },
        }));
        
        logError('Store complete claim exception', error);
        return false;
        
      } finally {
        set(state => ({
          loading: {
            ...state.loading,
            completing: new Set([...state.loading.completing].filter(id => id !== claimId)),
          },
        }));
      }
    },

    // Fetch claims list
    fetchClaims: async (filters = {}, append = false) => {
      const { loading, filters: currentFilters } = get();
      
      if (loading.fetching) return;

      const newFilters = { ...currentFilters, ...filters };
      
      set(state => ({
        loading: { ...state.loading, fetching: true },
        errors: { ...state.errors, fetching: null },
        filters: newFilters,
      }));

      try {
        logUserAction('store_fetch_claims', { filters: newFilters, append });

        const response = await dropApi.getClaimHistory(newFilters);

        if (isApiError(response)) {
          // If API fails, provide mock data for development
          const errorCode = typeof response.error === 'string' ? null : response.error.code;
          if (errorCode === 'NETWORK_ERROR') {
            logInfo('Using mock data for claims - API not available');
            
            // Mock claims data
            const mockClaims = [
              {
                id: 'mock-claim-1',
                userId: 'user-1',
                dropId: 'drop-1',
                claimCode: 'MOCK001',
                status: 'pending',
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              },
              {
                id: 'mock-claim-2',
                userId: 'user-1',
                dropId: 'drop-2',
                claimCode: 'MOCK002',
                status: 'completed',
                expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              }
            ];

            const claimsMap = new Map<string, Claim>();
            const claimsByDropMap = new Map<string, string>();
            
            mockClaims.forEach((claimData) => {
              const claim: Claim = {
                id: claimData.id,
                userId: claimData.userId,
                dropId: claimData.dropId,
                claimCode: claimData.claimCode,
                status: claimData.status as ClaimStatus,
                expiresAt: claimData.expiresAt,
                createdAt: claimData.createdAt,
                completedAt: claimData.completedAt,
              };
              
              claimsMap.set(claim.id, claim);
              claimsByDropMap.set(claim.dropId, claim.id);
            });

            set(state => ({
              claims: append ? new Map([...state.claims, ...claimsMap]) : claimsMap,
              claimsByDrop: append ? new Map([...state.claimsByDrop, ...claimsByDropMap]) : claimsByDropMap,
              totalCount: mockClaims.length,
              hasMore: false,
              lastFetchTime: Date.now(),
            }));

            return;
          }
          
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : response.error.message || 'Unknown error occurred';
          
          set(state => ({
            errors: { ...state.errors, fetching: errorMessage },
          }));
          logError('Store fetch claims failed', response.error);
          return;
        }

        const { data, count } = response;
        const claimsMap = new Map<string, Claim>();
        const claimsByDropMap = new Map<string, string>();

        // Safely handle API response data
        let claims: any[] = [];
        
        if (Array.isArray(data)) {
          claims = data;
        } else if (data && typeof data === 'object' && 'claims' in data && Array.isArray((data as any).claims)) {
          claims = (data as any).claims;
        } else if (data) {
          // If data is a single object, wrap in array
          claims = [data];
        }

        claims.forEach((claimData: any) => {
          // Ensure claimData exists and has required fields
          if (!claimData || !claimData.id) return;
          
          // Convert API response to Claim object
          const claim: Claim = {
            id: claimData.id,
            userId: claimData.userId || '',
            dropId: claimData.dropId || '',
            claimCode: claimData.claimCode || '',
            status: claimData.status || 'pending',
            expiresAt: claimData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            createdAt: claimData.createdAt || new Date().toISOString(),
            completedAt: claimData.completedAt,
          };
          
          claimsMap.set(claim.id, claim);
          claimsByDropMap.set(claim.dropId, claim.id);
        });

        set(state => ({
          claims: append ? new Map([...state.claims, ...claimsMap]) : claimsMap,
          claimsByDrop: append ? new Map([...state.claimsByDrop, ...claimsByDropMap]) : claimsByDropMap,
          totalCount: count || claims.length,
          hasMore: count ? (newFilters.offset || 0) + claims.length < count : false,
          lastFetchTime: Date.now(),
        }));

        logInfo('Store fetch claims success', { count, total: count });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claims';
        set(state => ({
          errors: { ...state.errors, fetching: errorMessage },
        }));
        logError('Store fetch claims exception', error);
        
      } finally {
        set(state => ({
          loading: { ...state.loading, fetching: false },
        }));
      }
    },

    // Fetch single claim status
    fetchClaimStatus: async (dropId: string) => {
      try {
        logUserAction('store_fetch_claim_status', { dropId });

        const response = await dropApi.getClaimStatus(dropId);

        if (isApiError(response)) {
          // 404 is expected if user hasn't claimed
          const errorCode = typeof response.error === 'string' ? null : response.error.code;
          if (errorCode !== '404') {
            logError('Store fetch claim status failed', response.error);
          }
          return null;
        }

        const claim = response.data.claim;
        if (claim) {
          set(state => ({
            claims: new Map([...state.claims, [claim.id, claim]]),
            claimsByDrop: new Map([...state.claimsByDrop, [dropId, claim.id]]),
          }));
        }

        return claim || null;

      } catch (error) {
        logError('Store fetch claim status exception', error);
        return null;
      }
    },

    // Refresh claims
    refreshClaims: async () => {
      const { filters } = get();
      return get().fetchClaims({ ...filters, offset: 0 }, false);
    },

    // Clear error
    clearError: (type, id) => {
      set(state => {
        const newErrors = { ...state.errors };
        
        if (type === 'fetching') {
          newErrors.fetching = null;
        } else if (id) {
          const errorMap = new Map(newErrors[type]);
          errorMap.delete(id);
          newErrors[type] = errorMap;
        }
        
        return { errors: newErrors };
      });
    },

    // Update filters
    updateFilters: (newFilters) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters },
      }));
    },

    // Reset filters
    resetFilters: () => {
      set({ filters: initialFilters });
    },

    // Optimistic claim update
    optimisticClaimUpdate: (dropId, claimData) => {
      const tempId = `temp-${dropId}-${Date.now()}`;
      const tempClaim: Claim = {
        id: tempId,
        userId: '',
        dropId,
        claimCode: '',
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        ...claimData,
      } as Claim;

      set(state => ({
        claims: new Map([...state.claims, [tempId, tempClaim]]),
        claimsByDrop: new Map([...state.claimsByDrop, [dropId, tempId]]),
      }));
    },

    // Revert optimistic update
    revertOptimisticUpdate: (dropId) => {
      set(state => {
        const claimId = state.claimsByDrop.get(dropId);
        if (claimId?.startsWith('temp-')) {
          const newClaims = new Map(state.claims);
          const newClaimsByDrop = new Map(state.claimsByDrop);
          newClaims.delete(claimId);
          newClaimsByDrop.delete(dropId);
          
          return {
            claims: newClaims,
            claimsByDrop: newClaimsByDrop,
          };
        }
        return state;
      });
    },

    // Clear all data
    clearAll: () => {
      set({
        claims: new Map<string, Claim>(),
        claimsByDrop: new Map<string, string>(),
        loading: {
          claiming: new Set<string>(),
          completing: new Set<string>(),
          fetching: false,
        },
        errors: {
          claiming: new Map<string, string>(),
          completing: new Map<string, string>(),
          fetching: null,
        },
        filters: initialFilters,
        totalCount: 0,
        hasMore: true,
        lastFetchTime: null,
      });
    },
  }))
);

// Selectors for better performance 
export const useClaimData = (claimId?: string) => {
  return useClaimStore(state => claimId ? state.claims.get(claimId) : undefined);
};

export const useClaimForDrop = (dropId: string) => {
  return useClaimStore(state => {
    const claimId = state.claimsByDrop.get(dropId);
    return claimId ? state.claims.get(claimId) : undefined;
  });
};

export const useClaimLoading = (type: 'claiming' | 'completing' | 'fetching', id?: string) => {
  return useClaimStore(state => {
    if (type === 'fetching') return state.loading.fetching;
    return id ? state.loading[type].has(id) : false;
  });
};

export const useClaimError = (type: 'claiming' | 'completing' | 'fetching', id?: string) => {
  return useClaimStore(state => {
    if (type === 'fetching') return state.errors.fetching;
    return id ? state.errors[type].get(id) : undefined;
  });
};

export { useClaimStore };