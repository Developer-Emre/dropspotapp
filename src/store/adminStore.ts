import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useMemo } from 'react';
import { Drop } from '@/types/drops';
import { ApiError } from '@/types/errors';
import { getDrops, isAdminApiError, createDrop, updateDrop, deleteDrop, bulkDeleteDrops } from '@/lib/adminApi';

// Admin-specific types
export interface AdminDropFormData {
  title: string;
  description: string;
  totalStock: number;
  startDate: string;
  endDate: string;
  claimWindowStart: string;
  imageUrl?: string;
}

export interface AdminDrop extends Drop {
  isActive: boolean;
}

export interface AdminDropStats {
  totalDrops: number;
  activeDrops: number;
  totalUsers: number;
  totalClaims: number;
  totalWaitlisted: number;
  revenue: number;
  pendingApprovals: number;
  conversionRate: number;
}

export interface AdminDrop extends Drop {
  waitlistEntries?: Array<{
    id: string;
    userId: string;
    position: number;
    priorityScore: number;
    joinedAt: string;
  }>;
  claims?: Array<{
    id: string;
    userId: string;
    status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
    claimedAt: string;
    expiresAt: string;
  }>;
}

export interface AdminFilter {
  status?: 'all' | 'upcoming' | 'waitlist' | 'claiming' | 'ended';
  search?: string;
  sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'totalStock' | 'claimedStock';
  sortOrder?: 'asc' | 'desc';
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface AdminState {
  // Data
  drops: AdminDrop[];
  stats: AdminDropStats | null;
  currentDrop: AdminDrop | null;
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSubmitting: boolean;
  error: string | null;
  filter: AdminFilter;
  selectedDrops: string[];
  
  // Form State
  formData: AdminDropFormData;
  formErrors: Record<string, string>;
  isDirty: boolean;
  
  // Actions
  loadDrops: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadDrop: (id: string) => Promise<void>;
  createDrop: (data: AdminDropFormData) => Promise<{ success: boolean; drop?: AdminDrop; error?: string; validationErrors?: any[] }>;
  updateDrop: (id: string, data: Partial<AdminDropFormData>) => Promise<{ success: boolean; drop?: AdminDrop; errors?: Record<string, string> }>;
  deleteDrop: (id: string) => Promise<{ success: boolean }>;
  bulkDelete: (ids: string[]) => Promise<{ success: boolean; deleted: number }>;
  
  // Filter & Search
  setFilter: (filter: Partial<AdminFilter>) => void;
  clearFilter: () => void;
  
  // Selection
  selectDrop: (id: string) => void;
  deselectDrop: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Form Management
  setFormData: (data: Partial<AdminDropFormData>) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormError: (field: string, error: string) => void;
  clearFormErrors: () => void;
  clearForm: () => void;
  resetForm: () => void;
  setIsDirty: (dirty: boolean) => void;
  validateForm: () => boolean;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialFormData: AdminDropFormData = {
  title: '',
  description: '',
  totalStock: 0,
  startDate: '',
  claimWindowStart: '',
  endDate: '',
  imageUrl: '',
};

const initialFilter: AdminFilter = {
  status: 'all',
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const initialStats: AdminDropStats = {
  totalDrops: 0,
  activeDrops: 0,
  totalUsers: 0,
  totalClaims: 0,
  totalWaitlisted: 0,
  revenue: 0,
  pendingApprovals: 0,
  conversionRate: 0,
};

export const useAdminStore = create<AdminState>()(
  devtools(
    (set, get) => ({
      // Initial state
      drops: [],
      stats: null,
      currentDrop: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isSubmitting: false,
      error: null,
      filter: initialFilter,
      selectedDrops: [],
      formData: initialFormData,
      formErrors: {},
      isDirty: false,

      // Load all drops with filtering
      loadDrops: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await getDrops();
          
          if (isAdminApiError(response)) {
            set({ error: response.message, isLoading: false });
            return;
          }
          
          set({ drops: response.data, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load drops', 
            isLoading: false 
          });
        }
      },

      // Load admin dashboard stats
      loadStats: async () => {
        try {
          // Stats endpoint not available yet in backend, using fallback data
          console.warn('Stats endpoint /admin/stats not available, using fallback data');
          set({
            stats: {
              totalDrops: get().drops.length,
              activeDrops: get().drops.filter(d => d.isActive).length,
              totalUsers: 0,
              totalClaims: get().drops.reduce((sum, drop) => sum + drop.claimedStock, 0),
              totalWaitlisted: get().drops.reduce((sum, drop) => sum + (drop.waitlistCount || 0), 0),
              revenue: 0,
              pendingApprovals: 0,
              conversionRate: 0,
            }
          });
        } catch (error) {
          console.warn('Failed to calculate stats:', error);
          set({
            stats: {
              totalDrops: 0,
              activeDrops: 0,
              totalUsers: 0,
              totalClaims: 0,
              totalWaitlisted: 0,
              revenue: 0,
              pendingApprovals: 0,
              conversionRate: 0,
            }
          });
        }
      },

      // Load single drop with details
      loadDrop: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // First try to find in existing drops array for performance
          const existingDrop = get().drops.find(drop => drop.id === id);
          if (existingDrop) {
            set({ 
              currentDrop: existingDrop, 
              formData: {
                title: existingDrop.title || '',
                description: existingDrop.description || '',
                totalStock: existingDrop.totalStock || 0,
                startDate: existingDrop.startDate || '',
                endDate: existingDrop.endDate || '',
                claimWindowStart: existingDrop.claimWindowStart || '',
                imageUrl: existingDrop.imageUrl || '',
              },
              isLoading: false 
            });
            return;
          }

          // If not found locally, fetch from backend
          const { getDrop } = await import('@/lib/adminApi');
          const response = await getDrop(id);
          
          if (isAdminApiError(response)) {
            set({ error: response.message || 'Drop not found', isLoading: false });
            return;
          }

          const drop = response.data;
          set({ 
            currentDrop: drop,
            formData: {
              title: drop.title || '',
              description: drop.description || '',
              totalStock: drop.totalStock || 0,
              startDate: drop.startDate || '',
              endDate: drop.endDate || '',
              claimWindowStart: drop.claimWindowStart || '',
              imageUrl: drop.imageUrl || '',
            },
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load drop', 
            isLoading: false 
          });
        }
      },

      // Create new drop
      createDrop: async (data: AdminDropFormData) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await createDrop(data);
          
          if (isAdminApiError(response)) {
            // Eğer validation errors varsa onları da handle et
            const errorDetails = response.errors; // ApiError type'ından gelen errors
            if (errorDetails && Array.isArray(errorDetails)) {
              const errorMessages = errorDetails.map((err: any) => err.msg).join(', ');
              set({ error: errorMessages, isCreating: false });
              return { success: false, error: errorMessages, validationErrors: errorDetails };
            }
            set({ error: response.message, isCreating: false });
            return { success: false, error: response.message };
          }
          
          // Backend controller'dan gelen response: { success: true, data: AdminDrop, message: string }
          const newDrop = response.data;
          set((state) => ({ 
            drops: [newDrop, ...state.drops],
            isCreating: false,
            formData: initialFormData,
            isDirty: false,
          }));
          
          return { success: true, drop: newDrop };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create drop';
          set({ error: errorMessage, isCreating: false });
          return { success: false, error: errorMessage };
        }
      },

      // Update existing drop
      updateDrop: async (id: string, data: Partial<AdminDropFormData>) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await updateDrop(id, data);
          
          if (isAdminApiError(response)) {
            set({ error: response.message, isUpdating: false });
            
            // Return validation errors if available
            if (response.errors) {
              const errorMap: Record<string, string> = {};
              response.errors.forEach((err: { field: string; message: string }) => {
                errorMap[err.field] = err.message;
              });
              return { success: false, errors: errorMap };
            }
            
            return { success: false };
          }
          
          // Backend controller'dan gelen response: { success: true, data: AdminDrop, message: string }
          const updatedDrop = response.data;
          
          // Optimistic update
          set((state) => ({
            drops: state.drops.map((drop) => 
              drop.id === id ? { ...drop, ...updatedDrop } : drop
            ),
            currentDrop: state.currentDrop?.id === id 
              ? { ...state.currentDrop, ...updatedDrop }
              : state.currentDrop,
            isUpdating: false,
            isDirty: false,
          }));
          
          return { success: true, drop: updatedDrop };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update drop';
          set({ error: errorMessage, isUpdating: false });
          return { success: false };
        }
      },

      // Delete single drop
      deleteDrop: async (id: string) => {
        set({ isDeleting: true, error: null });
        
        try {
          const response = await deleteDrop(id);
          
          if (isAdminApiError(response)) {
            set({ error: response.message, isDeleting: false });
            return { success: false };
          }
          
          // Optimistic update
          set((state) => ({
            drops: state.drops.filter((drop) => drop.id !== id),
            selectedDrops: state.selectedDrops.filter((dropId) => dropId !== id),
            currentDrop: state.currentDrop?.id === id ? null : state.currentDrop,
            isDeleting: false,
            error: null, // Clear error on success
          }));
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete drop';
          set({ error: errorMessage, isDeleting: false });
          return { success: false };
        }
      },

      // Bulk delete drops
      bulkDelete: async (ids: string[]) => {
        set({ isDeleting: true, error: null });
        
        try {
          const response = await bulkDeleteDrops(ids);
          
          if (isAdminApiError(response)) {
            set({ error: response.message, isDeleting: false });
            return { success: false, deleted: 0 };
          }
          
          // Backend'de individual delete işlemleri yapılıyor, sadece success mesajı döner
          const deletedCount = ids.length; // Başarılı olduğu için tüm idler silinmiş demektir
          
          // Optimistic update
          set((state) => ({
            drops: state.drops.filter((drop) => !ids.includes(drop.id)),
            selectedDrops: [],
            isDeleting: false,
            error: null, // Clear error on success
          }));
          
          return { success: true, deleted: deletedCount };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete drops';
          set({ error: errorMessage, isDeleting: false });
          return { success: false, deleted: 0 };
        }
      },

      // Filter management
      setFilter: (newFilter: Partial<AdminFilter>) => {
        set((state) => ({ 
          filter: { ...state.filter, ...newFilter },
        }));
      },

      clearFilter: () => {
        set({ filter: initialFilter });
      },

      // Selection management
      selectDrop: (id: string) => {
        set((state) => ({
          selectedDrops: [...state.selectedDrops, id],
        }));
      },

      deselectDrop: (id: string) => {
        set((state) => ({
          selectedDrops: state.selectedDrops.filter((dropId) => dropId !== id),
        }));
      },

      selectAll: () => {
        set((state) => ({
          selectedDrops: state.drops.map((drop) => drop.id),
        }));
      },

      clearSelection: () => {
        set({ selectedDrops: [] });
      },

      // Form management
      setFormData: (data: Partial<AdminDropFormData>) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
          isDirty: true,
        }));
      },

      setFormErrors: (errors: Record<string, string>) => {
        set({ formErrors: errors });
      },

      setFormError: (field: string, error: string) => {
        set((state) => ({
          formErrors: { ...state.formErrors, [field]: error },
        }));
      },

      clearFormErrors: () => {
        set({ formErrors: {} });
      },

      clearForm: () => {
        set({ 
          formData: initialFormData,
          formErrors: {},
          isDirty: false,
        });
      },

      setIsDirty: (dirty: boolean) => {
        set({ isDirty: dirty });
      },

      resetForm: () => {
        set({ 
          formData: initialFormData,
          formErrors: {},
          isDirty: false,
        });
      },

      validateForm: () => {
        const { formData } = get();
        const errors: Record<string, string> = {};

        if (!formData.title.trim()) {
          errors.title = 'Drop title is required';
        }
        
        if (!formData.description.trim()) {
          errors.description = 'Description is required';
        }
        
        if (formData.totalStock <= 0) {
          errors.totalStock = 'Stock must be greater than 0';
        }
        
        if (!formData.startDate) {
          errors.startDate = 'Start date is required';
        }
        
        if (!formData.claimWindowStart) {
          errors.claimWindowStart = 'Claim window start is required';
        }
        
        if (!formData.endDate) {
          errors.endDate = 'End date is required';
        }

        // Date validation
        const startDate = new Date(formData.startDate);
        const claimStart = new Date(formData.claimWindowStart);
        const endDate = new Date(formData.endDate);

        if (claimStart <= startDate) {
          errors.claimWindowStart = 'Claim window must start after drop start';
        }
        
        if (endDate <= claimStart) {
          errors.endDate = 'End date must be after claim window start';
        }

        set({ formErrors: errors });
        return Object.keys(errors).length === 0;
      },

      // Utils
      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          drops: [],
          stats: null,
          currentDrop: null,
          isLoading: false,
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
          error: null,
          filter: initialFilter,
          selectedDrops: [],
          formData: initialFormData,
          formErrors: {},
          isDirty: false,
        });
      },
    }),
    {
      name: 'admin-store',
      // Only store non-sensitive data
      partialize: (state: AdminState) => ({
        filter: state.filter,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useAdminDrops = () => useAdminStore((state) => state.drops);
export const useAdminStats = () => useAdminStore((state) => state.stats);
export const useAdminLoading = () => useAdminStore((state) => ({
  isLoading: state.isLoading,
  isCreating: state.isCreating,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting,
}));
export const useAdminFilter = () => useAdminStore((state) => state.filter);
export const useAdminSelection = () => useAdminStore((state) => state.selectedDrops);
export const useAdminForm = () => useAdminStore((state) => ({
  formData: state.formData,
  formErrors: state.formErrors,
  isDirty: state.isDirty,
}));

// Computed selectors
export const useFilteredDrops = () => {
  const drops = useAdminStore((state) => state.drops);
  const filter = useAdminStore((state) => state.filter);
  
  return useMemo(() => {
    let filtered = [...drops];
    
    // Filter by status
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter((drop) => drop.status === filter.status);
    }
    
    // Filter by search
    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter((drop) => 
        drop.title.toLowerCase().includes(search) ||
        drop.description.toLowerCase().includes(search)
      );
    }
    
    // Sort
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        const field = filter.sortBy!;
        let aValue = a[field as keyof AdminDrop];
        let bValue = b[field as keyof AdminDrop];
        
        if (field.includes('Date') || field === 'createdAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }
        
        // Ensure values are not null/undefined
        if (aValue == null) aValue = 0;
        if (bValue == null) bValue = 0;
        
        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filter.sortOrder === 'desc' ? -result : result;
      });
    }
    
    return filtered;
  }, [drops, filter.status, filter.search, filter.sortBy, filter.sortOrder]);
};