// ============================================
// DELETE CONFIRMATION MODAL COMPONENT
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useAdminStore, AdminDrop } from '@/store/adminStore';
import { useErrorToast } from '@/providers/ErrorToastProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  ExclamationTriangleIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dropToDelete: AdminDrop | null;
  selectedDrops?: string[];
  onDeleteComplete: () => void;
}

interface DeleteWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
  icon?: React.ElementType;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  dropToDelete, 
  selectedDrops = [], 
  onDeleteComplete 
}: DeleteConfirmationModalProps) {
  const { deleteDrop, bulkDelete, isDeleting, error } = useAdminStore();
  const { showError, showSuccess } = useErrorToast();
  const [confirmText, setConfirmText] = useState('');
  const [warnings, setWarnings] = useState<DeleteWarning[]>([]);
  const [isValidatingDeletion, setIsValidatingDeletion] = useState(false);

  const isBulkDelete = selectedDrops.length > 0 && !dropToDelete;
  const dropCount = isBulkDelete ? selectedDrops.length : 1;
  const dropTitle = dropToDelete?.title || 'selected drops';

    // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setWarnings([]);
      validateDeletion();
    } else {
      setWarnings([]);
    }
  }, [isOpen]);

  // Clear error when it changes in store - only show toast once
  useEffect(() => {
    if (error && isOpen) {
      // Show toast notification for the error
      if (error.includes('waitlist entries or claims')) {
        showError(
          'Cannot Delete Drop', 
          'This drop has existing waitlist entries or claims. Remove them before deleting.',
          {
            label: 'View Drop Details',
            handler: () => {
              // Optional: Navigate to drop details to see waitlist/claims
            }
          }
        );
      } else {
        showError('Delete Failed', error);
      }
    }
  }, [error]); // Remove showError from dependencies to prevent loop

  const validateDeletion = async () => {
    setIsValidatingDeletion(true);
    const newWarnings: DeleteWarning[] = [];

    try {
      if (dropToDelete) {
        // Check if drop is active
        if (dropToDelete.status === 'claiming' || dropToDelete.status === 'waitlist') {
          newWarnings.push({
            type: 'warning',
            message: `This drop is currently ${dropToDelete.status}. Users may be waiting for it or have already claimed spots.`,
            icon: ExclamationTriangleIcon
          });
        }

        // Check for claims
        const claimsCount = dropToDelete.claims?.length || dropToDelete._count?.claims || 0;
        if (claimsCount > 0) {
          newWarnings.push({
            type: 'error',
            message: `This drop has ${claimsCount} active claims. Deleting it will affect users who have claimed spots.`,
            icon: ExclamationCircleIcon
          });
        }

        // Check for waitlist
        const waitlistCount = dropToDelete.waitlistEntries?.length || dropToDelete._count?.waitlistEntries || dropToDelete.waitlistCount || 0;
        if (waitlistCount > 0) {
          newWarnings.push({
            type: 'warning',
            message: `This drop has ${waitlistCount} users on the waitlist. They will be notified of the cancellation.`,
            icon: ExclamationTriangleIcon
          });
        }

        // Check if it's a recent drop
        const createdDate = new Date(dropToDelete.createdAt);
        const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceCreated < 1) {
          newWarnings.push({
            type: 'info',
            message: 'This drop was created recently. Make sure you want to delete it permanently.',
            icon: CheckCircleIcon
          });
        }
      }

      // Bulk delete warnings
      if (isBulkDelete) {
        newWarnings.push({
          type: 'warning',
          message: `You are about to delete ${dropCount} drops. This action cannot be undone.`,
          icon: ExclamationTriangleIcon
        });
      }

      setWarnings(newWarnings);
    } finally {
      setIsValidatingDeletion(false);
    }
  };

  const requiredConfirmText = isBulkDelete 
    ? `DELETE ${dropCount} DROPS` 
    : `DELETE ${dropToDelete?.title?.toUpperCase() || ''}`;

  const isConfirmValid = confirmText === requiredConfirmText;
  const hasBlockingErrors = warnings.some(w => w.type === 'error');

  const handleDelete = async () => {
    if (!isConfirmValid || hasBlockingErrors || isDeleting) {
      return;
    }

    try {
      let success = false;

      if (isBulkDelete) {
        const result = await bulkDelete(selectedDrops);
        success = result.success;
      } else if (dropToDelete) {
        const result = await deleteDrop(dropToDelete.id);
        success = result.success;
      }

      if (success) {
        // Show success toast
        if (isBulkDelete) {
          showSuccess(
            'Drops Deleted', 
            `Successfully deleted ${dropCount} drops.`
          );
        } else {
          showSuccess(
            'Drop Deleted', 
            `"${dropToDelete?.title}" has been successfully deleted.`
          );
        }
        
        onDeleteComplete();
        onClose();
      } 
      // Error will be handled by the useEffect watching the error state
    } catch (error) {
      console.error('Delete operation failed:', error);
      const errorMessage = 'An unexpected error occurred during deletion';
      showError('Delete Failed', errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isBulkDelete ? `Delete ${dropCount} Drops` : 'Delete Drop'}
              </h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {isBulkDelete 
                    ? `Are you sure you want to delete ${dropCount} selected drops? This action cannot be undone.`
                    : `Are you sure you want to delete "${dropTitle}"? This action cannot be undone.`
                  }
                </p>
              </div>

              {/* Validation Loading */}
              {isValidatingDeletion && (
                <div className="mt-4 flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">Checking dependencies...</span>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && !isValidatingDeletion && (
                <div className="mt-4 space-y-3">
                  {warnings.map((warning, index) => {
                    const IconComponent = warning.icon || ExclamationTriangleIcon;
                    return (
                      <div 
                        key={index}
                        className={`flex items-start p-3 rounded-md ${
                          warning.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
                          warning.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                          'bg-blue-50 border-l-4 border-blue-400'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <IconComponent 
                            className={`h-5 w-5 ${
                              warning.type === 'error' ? 'text-red-400' :
                              warning.type === 'warning' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`}
                          />
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm ${
                            warning.type === 'error' ? 'text-red-700' :
                            warning.type === 'warning' ? 'text-yellow-700' :
                            'text-blue-700'
                          }`}>
                            {warning.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirmation Input */}
              {!hasBlockingErrors && !isValidatingDeletion && (
                <div className="mt-4">
                  <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-2">
                    Type <strong>{requiredConfirmText}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={requiredConfirmText}
                    className="block w-full border-gray-300 text-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    autoComplete="off"
                  />
                  {confirmText && !isConfirmValid && (
                    <p className="mt-1 text-sm text-red-600">
                      Please type the exact confirmation text.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Footer */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            {!hasBlockingErrors ? (
              <button
                type="button"
                disabled={!isConfirmValid || isDeleting || isValidatingDeletion}
                onClick={handleDelete}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            ) : (
              <div className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-100 text-base font-medium text-gray-500 sm:ml-3 sm:w-auto sm:text-sm cursor-not-allowed">
                Cannot Delete
              </div>
            )}
            
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}