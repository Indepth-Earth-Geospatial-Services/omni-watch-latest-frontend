'use client';

import { useState } from 'react';
import { BarChart3, Brain, Plane, Radio, Bell } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';
import { FleetAnalyticsTab } from './FleetAnalyticsTab';
import { AIDetectionAnalyticsTab } from './AIDetectionAnalyticsTab';
import { FlightOperationsTab } from './FlightOperationsTab';
import { StreamAnalyticsTab } from './StreamAnalyticsTab';
import { AlertAnalyticsTab } from './AlertAnalyticsTab';

const tabs = [
  { id: 'fleet', label: 'Fleet', icon: Plane },
  { id: 'ai-detection', label: 'AI Detection', icon: Brain },
  { id: 'flight-ops', label: 'Flight Operations', icon: BarChart3 },
  { id: 'streams', label: 'Streams', icon: Radio },
  { id: 'alerts', label: 'Alerts', icon: Bell },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('fleet');

  const renderTab = () => {
    switch (activeTab) {
      case 'fleet':
        return <FleetAnalyticsTab />;
      case 'ai-detection':
        return <AIDetectionAnalyticsTab />;
      case 'flight-ops':
        return <FlightOperationsTab />;
      case 'streams':
        return <StreamAnalyticsTab />;
      case 'alerts':
        return <AlertAnalyticsTab />;
      default:
        return <FleetAnalyticsTab />;
    }
  };

  return (
    <MainLayout title='Analytics' subtitle='Operational insights and trends'>
      <div className='space-y-4'>
        {/* Tab Bar */}
        <div className='flex items-center gap-1 bg-card border border-border/50 rounded-xl p-1'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                  isActive
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Icon className='w-4 h-4' />
                <span className='hidden sm:inline'>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>{renderTab()}</div>
      </div>
    </MainLayout>
  );
}
