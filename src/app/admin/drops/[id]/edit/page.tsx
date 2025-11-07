'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import { adminValidation } from '@/lib/adminApi';
import { useErrorToast } from '@/providers/ErrorToastProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  CalendarDaysIcon,
  ClockIcon,
  CubeIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function EditDrop() {
  const router = useRouter();
  const params = useParams();
  const dropId = params.id as string;

  const {
    formData,
    formErrors,
    isDirty,
    isSubmitting,
    error,
    updateDrop,
    loadDrop,
    setFormData,
    clearForm,
    setFormErrors,
    setIsDirty
  } = useAdminStore();

  const { showSuccess, showError } = useErrorToast();

  const [isLoading, setIsLoading] = useState(true);
  const [originalData, setOriginalData] = useState(null);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: Record<string, string> }>({
    isValid: false,
    errors: {}
  });
  const hasLoadedDrop = useRef(false);

  // Load the drop data for editing
  useEffect(() => {
    if (dropId && !hasLoadedDrop.current) {
      loadDropForEdit();
      hasLoadedDrop.current = true;
    }
  }, [dropId]);

  // Validate form data whenever it changes
  useEffect(() => {
    const result = adminValidation.validateDropForm(formData);
    setValidationResult(result);
  }, [formData]);

  const loadDropForEdit = async () => {
    setIsLoading(true);
    try {
      // Load the drop data using the store
      await loadDrop(dropId);
      
      // The loadDrop function should populate the form data
      // For now, if no data is loaded, show an error
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load drop:', error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ [field]: value });
    setIsDirty(true);
    
    // Clear field error if it exists
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  const validateForm = () => {
    const validation = adminValidation.validateDropForm(formData);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await updateDrop(dropId, formData);
      
      if (result.success) {
        showSuccess(
          'Drop Updated', 
          'Drop has been successfully updated.'
        );
        router.push('/admin/drops');
      } else {
        // Handle validation errors from backend
        if (result.errors) {
          // Show backend validation errors
          const newErrors = { ...formErrors, ...result.errors };
          setFormErrors(newErrors);
          
          showError(
            'Validation Failed', 
            'Please fix the errors below and try again.'
          );
          
          console.error('Validation errors:', result.errors);
        } else {
          showError(
            'Update Failed', 
            'Failed to update drop. Please try again.'
          );
        }
      }
    } catch (error) {
      console.error('Failed to update drop:', error);
      showError(
        'Update Error', 
        'An unexpected error occurred while updating the drop.'
      );
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        clearForm();
        router.push('/admin/drops');
      }
    } else {
      router.push('/admin/drops');
    }
  };

  if (isLoading) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-gray-600">Loading drop data...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  if (error) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading drop</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/admin/drops')}
                    className="text-sm bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200"
                  >
                    Back to Drops
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  const getTimelineData = () => {
    if (!formData.startDate || !formData.endDate) {
      return null;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return { start, end, now, duration };
  };  const timeline = getTimelineData();

  return (
    <AdminAuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-1" />
                  Back
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Edit Drop
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Update drop details and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isDirty || isSubmitting || !validationResult.isValid}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white shadow px-4 py-5 sm:p-6 rounded-lg">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Drop Information</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Basic details about your drop.
                      </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Drop Title *
                          </label>
                          <input
                            type="text"
                            id="title"
                            value={formData.title || ''}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              formErrors.title ? 'border-red-300' : ''
                            }`}
                            placeholder="Enter drop title"
                          />
                          {formErrors.title && (
                            <p className="mt-2 text-sm text-red-600">{formErrors.title}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description *
                          </label>
                          <textarea
                            id="description"
                            rows={3}
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              formErrors.description ? 'border-red-300' : ''
                            }`}
                            placeholder="Describe your drop"
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
                            id="totalStock"
                            value={formData.totalStock || ''}
                            onChange={(e) => handleInputChange('totalStock', parseInt(e.target.value))}
                            className={`mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              formErrors.totalStock ? 'border-red-300' : ''
                            }`}
                            placeholder="Total available stock"
                          />
                          {formErrors.totalStock && (
                            <p className="mt-2 text-sm text-red-600">{formErrors.totalStock}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timing Configuration */}
                <div className="bg-white shadow px-4 py-5 sm:p-6 rounded-lg">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                        <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                        Timing Configuration
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        When your drop will be available and when claiming starts.
                      </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Drop Start Date *
                          </label>
                          <input
                            type="datetime-local"
                            id="startDate"
                            value={formData.startDate || ''}
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
                            id="claimWindowStart"
                            value={formData.claimWindowStart || ''}
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
                            id="endDate"
                            value={formData.endDate || ''}
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
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="bg-white shadow px-4 py-5 sm:p-6 rounded-lg">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Image</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Optional drop image URL.
                      </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                          Image URL
                        </label>
                        <input
                          type="url"
                          id="imageUrl"
                          value={formData.imageUrl || ''}
                          onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                          className="mt-1 block w-full text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Preview/Timeline */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Drop Timeline</h3>
                  {timeline && (
                    <div className="space-y-4">
                      <div className="flex items-center text-sm">
                        <CalendarDaysIcon className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                          <div className="font-medium">Start</div>
                          <div className="text-gray-500">
                            {timeline.start.toLocaleDateString()} at {timeline.start.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <div className="font-medium">Duration</div>
                          <div className="text-gray-500">{timeline.duration} days</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <CalendarDaysIcon className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <div className="font-medium">End</div>
                          <div className="text-gray-500">
                            {timeline.end.toLocaleDateString()} at {timeline.end.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center text-sm">
                          <div className="flex-1">
                            <div className="font-medium">
                              {timeline.now < timeline.start ? 'Upcoming' : 
                               timeline.now > timeline.end ? 'Ended' : 'Active'}
                            </div>
                            <div className="text-gray-500">Current status</div>
                          </div>
                          <div className={`h-2 w-2 rounded-full ${
                            timeline.now < timeline.start ? 'bg-yellow-400' : 
                            timeline.now > timeline.end ? 'bg-red-400' : 'bg-green-400'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {formData.imageUrl && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                    <div className="aspect-w-1 aspect-h-1">
                      <img
                        src={formData.imageUrl}
                        alt="Drop preview"
                        className="w-full h-40 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Form Status */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Form Status
                    </h3>
                    
                    <div className="flex items-center mb-4">
                      {validationResult.isValid ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-green-700">Ready to Update</span>
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

                {isDirty && (
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          You have unsaved changes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}