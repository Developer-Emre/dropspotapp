'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal';
import { useAdminStore, useFilteredDrops, AdminDrop } from '@/store/adminStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarDaysIcon,
  UsersIcon,
  CubeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DropActionsMenuProps {
  drop: AdminDrop;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function DropActionsMenu({ drop, onEdit, onDelete, onView }: DropActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-400 hover:text-gray-600"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onView(drop.id);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <EyeIcon className="h-4 w-4 mr-3" />
              View Details
            </button>
            <button
              onClick={() => {
                onEdit(drop.id);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <PencilIcon className="h-4 w-4 mr-3" />
              Edit Drop
            </button>
            <button
              onClick={() => {
                onDelete(drop.id);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Delete Drop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FiltersProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

function Filters({ onFilterChange, currentFilters }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'waitlist', label: 'Waitlist Open' },
    { value: 'claiming', label: 'Claiming' },
    { value: 'ended', label: 'Ended' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'endDate', label: 'End Date' },
    { value: 'totalStock', label: 'Total Stock' },
    { value: 'claimedStock', label: 'Claimed Stock' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FunnelIcon className="h-4 w-4 mr-2" />
        Filters
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={currentFilters.status || 'all'}
                onChange={(e) => onFilterChange({ ...currentFilters, status: e.target.value })}
                className="w-full border-gray-300 text-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={currentFilters.sortBy || 'createdAt'}
                  onChange={(e) => onFilterChange({ ...currentFilters, sortBy: e.target.value })}
                  className="flex-1 border-gray-300 text-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={currentFilters.sortOrder || 'desc'}
                  onChange={(e) => onFilterChange({ ...currentFilters, sortOrder: e.target.value })}
                  className="border-gray-300 text-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onFilterChange({
                    status: 'all',
                    search: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                  });
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BulkActionsProps {
  selectedDrops: string[];
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

function BulkActions({ selectedDrops, onBulkDelete, onClearSelection }: BulkActionsProps) {
  if (selectedDrops.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900">
            {selectedDrops.length} drop{selectedDrops.length > 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={onBulkDelete}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDropsPage() {
  const {
    filter,
    selectedDrops,
    isLoading,
    isDeleting,
    error,
    loadDrops,
    setFilter,
    selectDrop,
    deselectDrop,
    selectAll,
    clearSelection,
    deleteDrop,
    bulkDelete,
  } = useAdminStore();

  const filteredDrops = useFilteredDrops();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dropToDelete, setDropToDelete] = useState<AdminDrop | null>(null);
  const hasLoadedDrops = useRef(false);

  useEffect(() => {
    if (!hasLoadedDrops.current) {
      loadDrops();
      hasLoadedDrops.current = true;
    }
  }, []);

  const handleSearch = (searchTerm: string) => {
    setFilter({ search: searchTerm });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilter(newFilters);
  };

  const handleSelectDrop = (dropId: string, checked: boolean) => {
    if (checked) {
      selectDrop(dropId);
    } else {
      deselectDrop(dropId);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAll();
    } else {
      clearSelection();
    }
  };

  const handleEdit = (dropId: string) => {
    window.location.href = `/admin/drops/${dropId}/edit`;
  };

  const handleView = (dropId: string) => {
    window.location.href = `/admin/drops/${dropId}`;
  };

  const handleDelete = (dropId: string) => {
    const drop = filteredDrops.find((d: AdminDrop) => d.id === dropId);
    if (drop) {
      setDropToDelete(drop);
      setShowDeleteConfirm(true);
    }
  };

  const handleBulkDelete = () => {
    if (selectedDrops.length > 0) {
      setDropToDelete(null); // Clear single drop selection for bulk delete
      setShowDeleteConfirm(true);
    }
  };

  const onDeleteComplete = () => {
    // Clear selections and refresh data
    clearSelection();
    setDropToDelete(null);
    loadDrops();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { color: 'bg-blue-100 text-blue-800', label: 'Upcoming' },
      waitlist: { color: 'bg-yellow-100 text-yellow-800', label: 'Waitlist' },
      claiming: { color: 'bg-green-100 text-green-800', label: 'Claiming' },
      ended: { color: 'bg-gray-100 text-gray-800', label: 'Ended' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ended;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <AdminAuthGuard>
      <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Drop Management
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage all drops, view analytics, and control access.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/admin/drops/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Drop
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading drops</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 text-gray-600 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search drops..."
              value={filter.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Filters
            currentFilters={filter}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Bulk Actions */}
        <BulkActions
          selectedDrops={selectedDrops}
          onBulkDelete={handleBulkDelete}
          onClearSelection={clearSelection}
        />

        {/* Drops Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredDrops.length === 0 ? (
            <div className="text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No drops found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter.search ? 'Try adjusting your search criteria.' : 'Get started by creating a new drop.'}
              </p>
              {!filter.search && (
                <div className="mt-6">
                  <Link
                    href="/admin/drops/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Drop
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedDrops.length === filteredDrops.length && filteredDrops.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrops.map((drop) => (
                  <tr key={drop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedDrops.includes(drop.id)}
                        onChange={(e) => handleSelectDrop(drop.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {drop.imageUrl ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={drop.imageUrl}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <CubeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {drop.title}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {drop.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(drop.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{drop.claimedStock}/{drop.totalStock}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min((drop.claimedStock / drop.totalStock) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarDaysIcon className="h-3 w-3 mr-1" />
                          {new Date(drop.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          → {new Date(drop.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs">{drop.waitlistCount || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <CubeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs">{drop.claimedStock}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropActionsMenu
                        drop={drop}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDropToDelete(null);
          }}
          dropToDelete={dropToDelete}
          selectedDrops={selectedDrops}
          onDeleteComplete={onDeleteComplete}
        />
      </div>
    </AdminLayout>
  </AdminAuthGuard>
  );
}