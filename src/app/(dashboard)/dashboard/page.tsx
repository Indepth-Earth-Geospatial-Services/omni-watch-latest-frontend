'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { StatCard } from '@/components/features/metrics/stat-card';

export default function DashboardPage() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <MainLayout
        title='Operations Center'
        subtitle='Real-time surveillance and intelligence dashboard'
      >
        <div className='space-y-6'>
          {/* Page Header */}
          <div className='flex items-center space-x-3'>
            <div className='flex items-center space-x-1 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700'>
              <i className='fas fa-heartbeat text-green-400 text-sm'></i>
              <span className='text-sm text-gray-300'>Health: 98%</span>
            </div>

            <button className='flex items-center px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors'>
              <i className='fas fa-cog text-gray-400 mr-2'></i>
              Performance
            </button>

            <button className='flex items-center px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors'>
              <i className='fas fa-bolt text-green-400 mr-2'></i>
              Auto: On
            </button>

            <button className='flex items-center px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors'>
              <i className='fas fa-sync-alt text-gray-400 mr-2'></i>
              Refresh
            </button>
          </div>

          {/* Key Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
              title='Active Incidents'
              value={7}
              icon='fas fa-exclamation-triangle'
              color='red'
              variant='hover-border'
              trend={{ direction: 'up', value: '+2 from yesterday', isPositive: false }}
            />
            <StatCard
              title='Threats Detected Today'
              value={23}
              icon='fas fa-shield-alt'
              color='yellow'
              variant='hover-border'
              trend={{ direction: 'up', value: '+5 from yesterday', isPositive: false }}
            />
            <StatCard
              title='Assets Online'
              value={142}
              icon='fas fa-broadcast-tower'
              color='green'
              variant='hover-border'
              trend={{ direction: 'up', value: '+1 from yesterday' }}
            />
            <StatCard
              title='Avg Response Time'
              value='2.4s'
              icon='fas fa-clock'
              color='blue'
              variant='hover-border'
              trend={{ direction: 'down', value: '-0.5s from yesterday' }}
            />
          </div>

          {/* Secondary Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCard title='Operational Efficiency' value='95%' icon='fas fa-chart-line' color='purple' />
            <StatCard title='Critical Incidents' value={2} icon='fas fa-exclamation-triangle' color='orange' />
            <StatCard title='Total Assets' value={156} icon='fas fa-heartbeat' color='green' />
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Recent Incidents */}
            <div className='lg:col-span-2 bg-card p-5 rounded-lg border border-gray-800'>
              <h3 className='font-bold mb-4 flex items-center'>
                <i className='fas fa-exclamation-circle text-red-400 mr-2'></i>
                Recent Incidents
              </h3>

              <div className='space-y-3'>
                <div className='p-3 bg-card border-l-4 border-red-500 rounded'>
                  <div className='flex justify-between items-center mb-1'>
                    <h4 className='font-semibold text-sm text-gray-200'>Unauthorized Entry</h4>
                    <span className='bg-red-600 text-xs px-2 py-1 rounded font-bold'>ACTIVE</span>
                  </div>
                  <p className='text-gray-400 text-xs mb-2'>Perimeter breach detected at Gate 7</p>
                  <div className='text-gray-500 text-xs flex items-center gap-3'>
                    <span><i className='fas fa-clock mr-1'></i>5m ago</span>
                    <span><i className='fas fa-map-marker-alt mr-1'></i>Sector 7</span>
                  </div>
                </div>

                <div className='p-3 bg-card border-l-4 border-yellow-500 rounded'>
                  <div className='flex justify-between items-center mb-1'>
                    <h4 className='font-semibold text-sm text-gray-200'>Suspicious Activity</h4>
                    <span className='bg-yellow-500 text-xs px-2 py-1 rounded font-bold'>INVESTIGATING</span>
                  </div>
                  <p className='text-gray-400 text-xs mb-2'>Unusual movement patterns detected</p>
                  <div className='text-gray-500 text-xs flex items-center gap-3'>
                    <span><i className='fas fa-clock mr-1'></i>12m ago</span>
                    <span><i className='fas fa-map-marker-alt mr-1'></i>Zone Alpha</span>
                  </div>
                </div>

                <div className='p-3 bg-card border-l-4 border-green-500 rounded'>
                  <div className='flex justify-between items-center mb-1'>
                    <h4 className='font-semibold text-sm text-gray-200'>Equipment Malfunction</h4>
                    <span className='bg-green-600 text-xs px-2 py-1 rounded font-bold'>RESOLVED</span>
                  </div>
                  <p className='text-gray-400 text-xs mb-2'>Camera 15 connectivity restored</p>
                  <div className='text-gray-500 text-xs flex items-center gap-3'>
                    <span><i className='fas fa-clock mr-1'></i>1h ago</span>
                    <span><i className='fas fa-map-marker-alt mr-1'></i>Building C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Status */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-100 flex items-center space-x-2'>
                <i className='fas fa-chart-line text-blue-500'></i>
                <span>Operational Status</span>
              </h3>

              <div className='space-y-3'>
                {[
                  { label: 'System Health', value: '98%' },
                  { label: 'Threat Detection', value: 'Active' },
                  { label: 'Network Status', value: 'Connected' },
                  { label: 'Database', value: 'Operational' },
                  { label: 'Response Time', value: '2.4s' },
                ].map(({ label, value }) => (
                  <div key={label} className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'>
                    <span className='text-sm text-gray-400'>{label}</span>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                      <span className='text-sm font-medium text-green-400'>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
