'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { StatCard } from '@/components/features/metrics/stat-card';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import {
  AlertTriangle,
  ShieldAlert,
  Radio,
  Clock,
  TrendingUp,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: devices = [], isLoading } = useDJIDevices();

  const assetsOnline = devices.filter((d) => d.status).length;
  const totalAssets = devices.length;
  const dronesOnline = devices.filter((d) => d.domain === '0' && d.status).length;

  return (
    <div className='bg-background text-foreground min-h-screen'>
      <MainLayout
        title='Operations Center'
        subtitle='Real-time surveillance and intelligence dashboard'
      >
        <div className='space-y-4 sm:space-y-6'>
          <div className='flex items-center gap-1.5 sm:gap-2 flex-wrap'>
            <div className='flex items-center gap-1 px-2 sm:px-3 py-1 bg-gray-800 rounded-lg border border-gray-700'>
              <span className='w-2 h-2 bg-green-400 rounded-full flex-shrink-0' />
              <span className='text-[clamp(0.65rem,2vw,0.875rem)] text-gray-300 whitespace-nowrap'>
                Health: 98%
              </span>
            </div>

            {['Performance', 'Auto: On', 'Refresh'].map((label) => (
              <button
                key={label}
                className='flex items-center px-2 sm:px-3 py-1 sm:py-2 text-[clamp(0.65rem,2vw,0.875rem)] bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap'
              >
                {label}
              </button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
              title='Active Incidents'
              value={7}
              icon={AlertTriangle}
              color='red'
              variant='hover-border'
              trend={{ direction: 'up', value: '+2 from yesterday', isPositive: false }}
            />
            <StatCard
              title='Threats Detected Today'
              value={23}
              icon={ShieldAlert}
              color='yellow'
              variant='hover-border'
              trend={{ direction: 'up', value: '+5 from yesterday', isPositive: false }}
            />
            <StatCard
              title='Assets Online'
              value={isLoading ? '…' : assetsOnline}
              icon={Radio}
              color='green'
              variant='hover-border'
              trend={{
                direction: 'up',
                value: `${dronesOnline} drone${dronesOnline !== 1 ? 's' : ''} active`,
              }}
            />
            <StatCard
              title='Avg Response Time'
              value='2.4s'
              icon={Clock}
              color='blue'
              variant='hover-border'
              trend={{ direction: 'down', value: '-0.5s from yesterday' }}
            />
          </div>

          {/* Secondary Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCard title='Operational Efficiency' value='95%' icon={TrendingUp} color='purple' />
            <StatCard title='Critical Incidents' value={2} icon={AlertTriangle} color='orange' />
            <StatCard
              title='Total Assets'
              value={isLoading ? '…' : totalAssets}
              icon={Radio}
              color='green'
            />
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Recent Incidents */}
            <div className='lg:col-span-2 bg-card p-5 rounded-lg border border-gray-800'>
              <h3 className='font-bold mb-4 flex items-center'>
                <AlertCircle className='text-red-400 mr-2 w-4 h-4' />
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
                    <span className='flex items-center gap-1'>
                      <Clock className='w-3 h-3' />
                      5m ago
                    </span>
                    <span className='flex items-center gap-1'>
                      <MapPin className='w-3 h-3' />
                      Sector 7
                    </span>
                  </div>
                </div>

                <div className='p-3 bg-card border-l-4 border-yellow-500 rounded'>
                  <div className='flex justify-between items-center mb-1'>
                    <h4 className='font-semibold text-sm text-gray-200'>Suspicious Activity</h4>
                    <span className='bg-yellow-500 text-xs px-2 py-1 rounded font-bold'>
                      INVESTIGATING
                    </span>
                  </div>
                  <p className='text-gray-400 text-xs mb-2'>Unusual movement patterns detected</p>
                  <div className='text-gray-500 text-xs flex items-center gap-3'>
                    <span className='flex items-center gap-1'>
                      <Clock className='w-3 h-3' />
                      12m ago
                    </span>
                    <span className='flex items-center gap-1'>
                      <MapPin className='w-3 h-3' />
                      Zone Alpha
                    </span>
                  </div>
                </div>

                <div className='p-3 bg-card border-l-4 border-green-500 rounded'>
                  <div className='flex justify-between items-center mb-1'>
                    <h4 className='font-semibold text-sm text-gray-200'>Equipment Malfunction</h4>
                    <span className='bg-green-600 text-xs px-2 py-1 rounded font-bold'>
                      RESOLVED
                    </span>
                  </div>
                  <p className='text-gray-400 text-xs mb-2'>Camera 15 connectivity restored</p>
                  <div className='text-gray-500 text-xs flex items-center gap-3'>
                    <span className='flex items-center gap-1'>
                      <Clock className='w-3 h-3' />
                      1h ago
                    </span>
                    <span className='flex items-center gap-1'>
                      <MapPin className='w-3 h-3' />
                      Building C
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Status */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-100 flex items-center space-x-2'>
                <TrendingUp className='text-blue-500 w-5 h-5' />
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
                  <div
                    key={label}
                    className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'
                  >
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
