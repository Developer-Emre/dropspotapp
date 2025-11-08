'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import { adminValidation } from '@/lib/adminApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useErrorToast } from '@/providers/ErrorToastProvider';
import { 
  CalendarDaysIcon,
  CubeIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CreateDropPage() {
  const router = useRouter();
  const { showError, showSuccess } = useErrorToast();
  const { 
    formData, 
    formErrors, 
    isDirty, 
    isCreating, 
    setFormData, 
    setFormError, 
    clearFormErrors,
    resetForm,
    createDrop 
  } = useAdminStore();

  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: Record<string, string> }>({
    isValid: false,
    errors: {}
  });

  // Real-time validation
  useEffect(() => {
    const result = adminValidation.validateDropForm(formData);
    setValidationResult(result);
  }, [formData]);

  // Reset form on component mount
  useEffect(() => {
    resetForm();
    return () => {
      if (isDirty) {
        // Could show unsaved changes warning here
      }
    };
  }, []); // Remove dependencies - only run on mount

  const handleInputChange = (field: string, value: any) => {
    setFormData({ [field]: value });
    
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      clearFormErrors();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const validation = adminValidation.validateDropForm(formData);
    
    if (!validation.isValid) {
      // Set all errors and show toast
      const errorMessages = Object.values(validation.errors);
      const firstError = errorMessages[0] as string; // İlk hatayı toast'ta göster
      showError('Please check your input', firstError);
      Object.entries(validation.errors).forEach(([field, error]) => {
        setFormError(field, error as string);
      });
      return;
    }

    try {
      const result = await createDrop(formData);
      
      if (result.success) {
        showSuccess('Success', 'Drop created successfully!');
        router.push('/admin/drops');
      } else {
        // Use error from result, not global error state
        if (result.error) {
          showError('Creation Failed', result.error);
        } else {
          showError('Creation Failed', 'Failed to create drop');
        }
      }
    } catch (err) {
      console.error('Failed to create drop:', err);
      showError('Unexpected Error', 'An unexpected error occurred while creating the drop');
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        resetForm();
        router.push('/admin/drops');
      }
    } else {
      router.push('/admin/drops');
    }
  };

  const getPhasePreview = () => {
    if (!formData.startDate || !formData.claimWindowStart || !formData.endDate) {
      return null;
    }

    const startDate = new Date(formData.startDate);
    const claimStart = new Date(formData.claimWindowStart);
    const endDate = new Date(formData.endDate);

    const waitlistDuration = claimStart.getTime() - startDate.getTime();
    const claimDuration = endDate.getTime() - claimStart.getTime();

    const formatDuration = (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        return `${days}d ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Drop Timeline Preview</h4>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-gray-900">Waitlist Phase</div>
              <div className="text-gray-500">
                {startDate.toLocaleDateString()} - {claimStart.toLocaleDateString()} 
                ({formatDuration(waitlistDuration)})
              </div>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-gray-900">Claim Window</div>
              <div className="text-gray-500">
                {claimStart.toLocaleDateString()} - {endDate.toLocaleDateString()}
                ({formatDuration(claimDuration)})
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminAuthGuard>
      <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Create New Drop
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Launch a new limited edition product drop
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Drop Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        disabled={isCreating}
                        readOnly={false}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.title ? 'border-red-300' : ''
                        } ${isCreating ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Enter drop title..."
                      />
                      {formErrors.title && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.title}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.description ? 'border-red-300' : ''
                        }`}
                        placeholder="Describe your drop..."
                      />
                      {formErrors.description && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.description}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="totalStock" className="block text-sm font-medium text-gray-700">
                        Total Stock *
                      </label>
                      <input
                        type="number"
                        name="totalStock"
                        id="totalStock"
                        min="1"
                        max="10000"
                        value={formData.totalStock}
                        onChange={(e) => handleInputChange('totalStock', parseInt(e.target.value) || 0)}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.totalStock ? 'border-red-300' : ''
                        }`}
                        placeholder="0"
                      />
                      {formErrors.totalStock && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.totalStock}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        id="imageUrl"
                        value={formData.imageUrl || ''}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.imageUrl ? 'border-red-300' : ''
                        }`}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formErrors.imageUrl && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.imageUrl}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timing Configuration */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Timing Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Drop Start Date *
                      </label>
                      <input
                        type="datetime-local"
                        name="startDate"
                        id="startDate"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.startDate ? 'border-red-300' : ''
                        }`}
                      />
                      {formErrors.startDate && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.startDate}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        When users can start joining the waitlist
                      </p>
                    </div>

                    <div>
                      <label htmlFor="claimWindowStart" className="block text-sm font-medium text-gray-700">
                        Claim Window Start *
                      </label>
                      <input
                        type="datetime-local"
                        name="claimWindowStart"
                        id="claimWindowStart"
                        value={formData.claimWindowStart}
                        onChange={(e) => handleInputChange('claimWindowStart', e.target.value)}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.claimWindowStart ? 'border-red-300' : ''
                        }`}
                      />
                      {formErrors.claimWindowStart && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.claimWindowStart}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        When claiming becomes available
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        Drop End Date *
                      </label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        id="endDate"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          formErrors.endDate ? 'border-red-300' : ''
                        }`}
                      />
                      {formErrors.endDate && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.endDate}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        When the drop ends completely
                      </p>
                    </div>
                  </div>

                  {getPhasePreview()}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCreating}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !validationResult.isValid}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <LoadingSpinner />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CubeIcon className="h-4 w-4 mr-2" />
                      Create Drop
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Validation Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Form Status
                </h3>
                
                <div className="flex items-center mb-4">
                  {validationResult.isValid ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-700">Ready to Create</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-sm font-medium text-amber-700">Needs Attention</span>
                    </>
                  )}
                </div>

                {Object.keys(validationResult.errors).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Issues to fix:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {Object.values(validationResult.errors).map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isDirty && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm text-amber-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Unsaved changes
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drop Preview */}
            {formData.title && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Preview
                  </h3>
                  
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {formData.imageUrl && (
                      <img 
                        src={formData.imageUrl} 
                        alt="Drop preview"
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <h4 className="font-medium text-gray-900 mb-1">{formData.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{formData.description}</p>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Stock: {formData.totalStock}</span>
                      <span>Status: Draft</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-blue-900 mb-4">
                  Tips for Success
                </h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Use clear, descriptive names that capture attention
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Allow at least 1 hour for waitlist phase
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Claims expire after 24 hours
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Higher stock = better conversion rates
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </AdminAuthGuard>
  );
}