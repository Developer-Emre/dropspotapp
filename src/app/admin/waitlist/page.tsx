'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { dropApi, isApiError } from '@/lib/dropApi';
import { Drop } from '@/types/drops';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminWaitlistData {
  dropId: string;
  dropTitle: string;
  totalWaitlist: number;
  phase: string;
  entries: Array<{
    userId: string;
    position: number;
    priorityScore: number;
    joinedAt: string;
  }>;
}

export default function AdminWaitlistPage() {
  const { data: session } = useSession();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [waitlistData, setWaitlistData] = useState<AdminWaitlistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all drops
      const dropsResponse = await dropApi.getDrops();
      if (isApiError(dropsResponse)) {
        setError('Failed to load drops');
        return;
      }

      setDrops(dropsResponse.data);

      // Mock waitlist data for each drop
      const mockWaitlistData: AdminWaitlistData[] = dropsResponse.data.map((drop, index) => ({
        dropId: drop.id,
        dropTitle: drop.title,
        totalWaitlist: drop.waitlistCount || 0,
        phase: drop.status,
        entries: Array.from({ length: Math.min(drop.waitlistCount || 0, 10) }, (_, i) => ({
          userId: `user-${i + 1}`,
          position: i + 1,
          priorityScore: Math.floor(Math.random() * 1000) + 500,
          joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        })),
      }));

      setWaitlistData(mockWaitlistData);
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  if (error) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <AdminLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Waitlist Management
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage waitlists across all drops.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {drops.length}
            </div>
            <div className="text-sm text-gray-600">Total Drops</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {waitlistData.reduce((sum, data) => sum + data.totalWaitlist, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Waitlist</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {waitlistData.filter(data => data.phase === 'waitlist').length}
            </div>
            <div className="text-sm text-gray-600">Active Waitlists</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">
              {waitlistData.filter(data => data.phase === 'claiming').length}
            </div>
            <div className="text-sm text-gray-600">Claiming Phase</div>
          </div>
        </div>

        {/* Waitlist Details */}
        <div className="space-y-6">
          {waitlistData.map((data) => (
            <div key={data.dropId} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {data.dropTitle}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Drop ID: {data.dropId}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      data.phase === 'waitlist' ? 'bg-blue-100 text-blue-800' :
                      data.phase === 'claiming' ? 'bg-green-100 text-green-800' :
                      data.phase === 'ended' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {data.phase.toUpperCase()}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {data.totalWaitlist} waiting
                    </span>
                  </div>
                </div>
              </div>

              {data.entries.length > 0 && (
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Top Waitlist Entries
                  </h4>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Position
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            User ID
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Priority Score
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Joined At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.entries.slice(0, 5).map((entry) => (
                          <tr key={`${data.dropId}-${entry.userId}`}>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">
                              #{entry.position}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {entry.userId}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {entry.priorityScore}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {new Date(entry.joinedAt).toLocaleDateString('tr-TR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.entries.length > 5 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center bg-gray-50">
                        ... and {data.entries.length - 5} more entries
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {waitlistData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No waitlist data available</p>
          </div>
        )}
      </AdminLayout>
    </AdminAuthGuard>
  );
}