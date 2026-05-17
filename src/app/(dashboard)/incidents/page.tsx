'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { StatCard } from '@/components/features/metrics/stat-card';
import { SearchFilter } from '@/components/features/filters/search-filter';
import { formatTimeAgo } from '@/lib/utils';
import { useWorkspaceHMS } from '@/hooks/useHMS';
import { DJI_CONFIG } from '@/lib/config/config';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  icon: string;
}

const incidents: Incident[] = [
  {
    id: 'ktxudzsv',
    title: 'Crowd Formation Detected',
    description: 'Large crowd gathering detected in market area with unusual activity patterns',
    status: 'OPEN',
    severity: 'HIGH',
    location: 'Kurmi Market, Kano',
    latitude: 11.9956,
    longitude: 8.5264,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    icon: 'fas fa-users',
  },
  {
    id: 'zmdizjgn',
    title: 'Vehicle Convoy Anomaly',
    description:
      'Unusual vehicle convoy detected along Lagos-Ibadan highway with irregular movement patterns',
    status: 'IN_PROGRESS',
    severity: 'MEDIUM',
    location: 'Lagos-Ibadan Expressway',
    latitude: 6.5244,
    longitude: 3.3792,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    icon: 'fas fa-car-side',
  },
  {
    id: 'alt0f0hb',
    title: 'Terminal Facility Alert',
    description: 'False alarm triggered by maintenance team at Kano terminal facility',
    status: 'RESOLVED',
    severity: 'LOW',
    location: 'Kano Distribution Hub',
    latitude: 12.0022,
    longitude: 8.5917,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    icon: 'fas fa-industry',
  },
  {
    id: 'sec9f2b1',
    title: 'Security Breach Alert',
    description:
      'Unauthorized access detected at perimeter checkpoint with potential security implications',
    status: 'ESCALATED',
    severity: 'CRITICAL',
    location: 'North Gate Checkpoint',
    latitude: 6.4455,
    longitude: 3.3958,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: 'fas fa-shield-alt',
  },
  {
    id: 'pip47k2m',
    title: 'Pipeline Infrastructure Alert',
    description:
      'Potential infrastructure damage detected along pipeline corridor via thermal sensors',
    status: 'OPEN',
    severity: 'HIGH',
    location: 'Pipeline KM-47',
    latitude: 7.2389,
    longitude: 4.1201,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    icon: 'fas fa-fire',
  },
];

export default function IncidentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(incidents);

  const filterIncidents = useCallback(() => {
    const filtered = incidents.filter((incident) => {
      const matchesSearch =
        !searchTerm ||
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });

    setFilteredIncidents(filtered);
  }, [searchTerm, statusFilter, severityFilter]);

  React.useEffect(() => {
    filterIncidents();
  }, [filterIncidents]);

  const getSeverityColors = (severity: string) => {
    const colors = {
      LOW: 'border-blue-500 bg-blue-500',
      MEDIUM: 'border-yellow-400 bg-yellow-400',
      HIGH: 'border-orange-500 bg-orange-500',
      CRITICAL: 'border-red-500 bg-red-500',
    };
    return colors[severity as keyof typeof colors] || 'border-gray-500 bg-gray-500';
  };

  const getStatusColors = (status: string) => {
    const colors = {
      OPEN: 'bg-red-500',
      IN_PROGRESS: 'bg-yellow-500',
      RESOLVED: 'bg-green-500',
      CLOSED: 'bg-gray-500',
      ESCALATED: 'bg-purple-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIncidents = incidents.filter((i) => {
    const incidentDate = new Date(i.createdAt);
    return incidentDate >= today;
  }).length;

  return (
    <div className='bg-background text-foreground min-h-screen'>
      <MainLayout title='' subtitle=''>
        <div className='p-6 space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <h2 className='font-semibold text-2xl'>
              <i className='fas fa-exclamation-triangle text-sky-400 mr-2'></i>
              Incident Management
            </h2>
            <div className='flex items-center space-x-3'>
              <button className='px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors'>
                <i className='fas fa-download mr-2'></i>Export
              </button>
              <button className='px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors'>
                <i className='fas fa-sync-alt mr-2'></i>Refresh
              </button>
              <button className='px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
                <i className='fas fa-plus mr-2'></i>New Incident
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatCard
              title='Total Incidents'
              value={totalIncidents}
              icon='fas fa-database'
              color='blue'
            />

            <StatCard
              title='Open Incidents'
              value={openIncidents}
              icon='fas fa-exclamation-circle'
              color='red'
            />

            <StatCard
              title='Critical Level'
              value={criticalIncidents}
              icon='fas fa-radiation'
              color='orange'
            />

            <StatCard
              title="Today's Reports"
              value={todayIncidents}
              icon='fas fa-chart-line'
              color='green'
            />
          </div>

          {/* Filters and Search */}
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder='Search incidents, locations, descriptions...'
            filters={[
              {
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                width: 'w-36',
                options: [
                  { value: 'all', label: 'All Status' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'RESOLVED', label: 'Resolved' },
                  { value: 'CLOSED', label: 'Closed' },
                  { value: 'ESCALATED', label: 'Escalated' },
                ],
              },
              {
                label: 'Severity',
                value: severityFilter,
                onChange: setSeverityFilter,
                width: 'w-32',
                options: [
                  { value: 'all', label: 'All Levels' },
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'CRITICAL', label: 'Critical' },
                ],
              },
            ]}
          />

          {/* Incidents List */}
          <div className='bg-card rounded-lg border border-gray-800'>
            <div className='p-4 border-b border-gray-800'>
              <h3 className='text-lg font-semibold flex items-center'>
                <i className='fas fa-exclamation-triangle text-blue-500 mr-2'></i>
                <span>Incidents ({filteredIncidents.length})</span>
              </h3>
            </div>

            <div className='p-4'>
              <div className='space-y-4'>
                {filteredIncidents.length === 0 ? (
                  <div className='text-center py-12'>
                    <i className='fas fa-exclamation-triangle text-6xl text-gray-500 mb-4'></i>
                    <p className='text-gray-400 text-lg'>No incidents found</p>
                    <p className='text-sm text-gray-500 mt-2'>
                      Try adjusting your search criteria or filters
                    </p>
                  </div>
                ) : (
                  filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-4 rounded-lg border ${getSeverityColors(incident.severity)} border-opacity-20 bg-opacity-5 hover:shadow-md cursor-pointer transition-all duration-200`}
                    >
                      <div className='flex items-start justify-between space-x-4'>
                        <div className='flex-1 space-y-3'>
                          <div className='flex items-start justify-between'>
                            <div className='space-y-2'>
                              <div className='flex items-center space-x-3'>
                                <h3 className='font-semibold text-gray-100'>
                                  <i className={`${incident.icon} mr-2`}></i>
                                  {incident.title}
                                </h3>
                                <span
                                  className={`text-xs ${getStatusColors(incident.status)} text-white px-2 py-1 rounded`}
                                >
                                  {incident.status.replace('_', ' ')}
                                </span>
                                <span
                                  className={`text-xs ${getSeverityColors(incident.severity)} text-white px-2 py-1 rounded`}
                                >
                                  {incident.severity}
                                </span>
                              </div>
                              <p className='text-sm text-gray-400'>{incident.description}</p>
                            </div>
                            <button className='p-2 hover:bg-graybg rounded-md transition-colors'>
                              <i className='fas fa-eye text-gray-400'></i>
                            </button>
                          </div>

                          <div className='flex items-center space-x-6 text-xs text-gray-500'>
                            <div className='flex items-center space-x-1'>
                              <i className='fas fa-clock'></i>
                              <span>{formatTimeAgo(incident.createdAt)}</span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <i className='fas fa-map-marker-alt'></i>
                              <span>{incident.location}</span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <i className='fas fa-id-badge'></i>
                              <span>ID: {incident.id}</span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <i className='fas fa-crosshairs'></i>
                              <span>
                                {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
