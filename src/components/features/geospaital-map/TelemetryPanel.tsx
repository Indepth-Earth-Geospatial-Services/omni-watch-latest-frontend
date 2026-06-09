'use client';
import { memo, useState } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  RefreshCw,
  ZoomIn,
  Layers,
  Navigation,
  Gauge,
  Battery,
  Wind,
  MapPin,
  Users,
  Crosshair,
  Video,
  Gamepad2,
  X,
} from 'lucide-react';
import { DJI_CONFIG } from '@/lib/config/config';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';
import type { FlightArea, DJIDevice, SyncFlightAreaRequest } from '@/lib/types';
import type { DronePositionType, SelectedDroneInfo, MapViewMode } from './map-types';

interface TelemetryPanelProps {
  // View mode
  viewMode: MapViewMode;
  onViewModeChange: (mode: MapViewMode) => void;
  // Draw mode
  isDrawMode: boolean;
  onToggleDrawMode: () => void;
  // Basemap
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  // Layers
  showElements: boolean;
  onShowElementsChange: (show: boolean) => void;
  elementCount: number;
  // Selected drone
  selectedDroneInfo: SelectedDroneInfo | null;
  // Fleet
  dronePositionsArray: DronePositionType[];
  getProcessedDroneData: (sn: string) => ProcessedDroneData | null;
  onFitToAllDrones: () => void;
  onFlyToDrone: (drone: DronePositionType) => void;
  selectedSn: string | null;
  // Geofences
  flightAreas: FlightArea[];
  isSyncing: boolean;
  onSyncGeofences: (req: SyncFlightAreaRequest) => void;
  boundDevices: DJIDevice[];
}

function batteryClass(pct: number) {
  if (pct < 20) return 'text-red-400';
  if (pct < 40) return 'text-yellow-400';
  return 'text-green-400';
}

export const TelemetryPanel = memo(
  ({
    viewMode,
    onViewModeChange,
    isDrawMode,
    onToggleDrawMode,
    selectedStyle,
    onStyleChange,
    showElements,
    onShowElementsChange,
    elementCount,
    selectedDroneInfo,
    dronePositionsArray,
    getProcessedDroneData,
    onFitToAllDrones,
    onFlyToDrone,
    selectedSn,
    flightAreas,
    isSyncing,
    onSyncGeofences,
    boundDevices,
  }: TelemetryPanelProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Render compact rounded button when panel is hidden
    if (!isOpen) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className='absolute top-3 right-3 sm:top-4 sm:right-4 bg-neutral-950/95 backdrop-blur-sm border border-gray-800 p-2.5 sm:p-3 rounded-full shadow-2xl z-20 text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center group'
          title='Open Map Controls'
        >
          <LayoutTemplate className='w-4.5 h-4.5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform' />
        </button>
      );
    }

    return (
      <div className='absolute top-3 right-3 sm:top-4 sm:right-4 bg-neutral-950/95 backdrop-blur-sm border border-gray-800 p-3 sm:p-4 rounded-xl shadow-2xl z-20 w-[240px] sm:w-72 max-w-[calc(100%-1.5rem)] max-h-[calc(100%-2rem)] overflow-y-auto space-y-3 sm:space-y-4 transition-all duration-200 animate-in fade-in zoom-in-95'>
        {/* Header with Collapse Button */}
        <div className='flex items-center gap-2 border-b border-gray-800/60 pb-1.5 sm:pb-2'>
          <LayoutTemplate className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400' />
          <h3 className='font-semibold text-xs sm:text-sm flex-1 text-gray-200'>Map Controls</h3>
          <button
            onClick={() => setIsOpen(false)}
            className='p-1 rounded-md text-gray-400 hover:text-white hover:bg-neutral-900 transition-colors'
            title='Collapse Controls'
          >
            <X className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
          </button>
        </div>

        {/* View mode toggle — Single vs Multi */}
        <div>
          <label className='block text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
            View Mode
          </label>
          <div className='flex rounded-lg overflow-hidden border border-gray-700'>
            <button
              onClick={() => onViewModeChange('multi')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 sm:py-1.5 text-[11px] sm:text-xs transition-colors ${
                viewMode === 'multi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-900 text-gray-400 hover:text-white'
              }`}
            >
              <Users className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
              Fleet
            </button>
            <button
              onClick={() => onViewModeChange('single')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 sm:py-1.5 text-[11px] sm:text-xs transition-colors ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-900 text-gray-400 hover:text-white'
              }`}
            >
              <Crosshair className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
              Single
            </button>
          </div>
          {viewMode === 'single' && !selectedSn && (
            <p className='text-[9px] text-yellow-500 mt-1 text-center'>
              Click a drone marker to track it
            </p>
          )}
        </div>

        {/* Draw mode — Add Element */}
        <button
          onClick={onToggleDrawMode}
          className={`w-full flex items-center justify-center gap-1 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs border transition-colors ${
            isDrawMode
              ? 'border-blue-600 bg-blue-600/20 text-blue-400 animate-pulse'
              : 'border-gray-700 bg-neutral-900 text-gray-400 hover:text-white hover:border-gray-500'
          }`}
        >
          <MapPin className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
          {isDrawMode ? 'Drawing Active…' : 'Add Element to Layer'}
        </button>

        {/* Basemap switcher */}
        <div>
          <label className='block text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
            Basemap
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => onStyleChange(e.target.value)}
            className='w-full p-1.5 sm:p-2 border border-gray-700 bg-neutral-900 rounded-lg text-xs sm:text-sm text-gray-200 outline-none'
          >
            <option value='dark'>Dark</option>
            <option value='positron'>Positron</option>
            <option value='satellite'>Satellite</option>
          </select>
        </div>

        {/* Layer toggles */}
        <div>
          <label className='block text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
            Layers
          </label>
          <label className='flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer select-none text-gray-300'>
            <input
              type='checkbox'
              checked={showElements}
              onChange={(e) => onShowElementsChange(e.target.checked)}
              className='rounded border-gray-700 bg-neutral-800 focus:ring-0 text-blue-600 w-3.5 h-3.5'
            />
            <Layers className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400' />
            <span className='truncate'>Map Elements ({elementCount})</span>
          </label>
        </div>

        {/* Action buttons */}
        <div className='flex gap-1.5'>
          <button
            onClick={onFitToAllDrones}
            disabled={dronePositionsArray.length === 0}
            className='flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-1 sm:py-1.5 px-1.5 rounded-lg text-[11px] sm:text-xs transition-colors truncate'
          >
            <ZoomIn className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
            Zoom All
          </button>

          {DJI_CONFIG.USE_DJI_CLOUD && (
            <button
              onClick={() => onSyncGeofences({ device_sn: boundDevices.map((d) => d.deviceSn) })}
              disabled={isSyncing || boundDevices.length === 0}
              className='flex-1 flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-1 sm:py-1.5 px-1.5 rounded-lg text-[11px] sm:text-xs transition-colors truncate'
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Sync…' : `Sync (${flightAreas.length})`}
            </button>
          )}
        </div>

        {/* Selected drone detail card */}
        {selectedDroneInfo && (
          <div className='border border-blue-700/50 rounded-xl p-2.5 bg-blue-950/20'>
            <div className='text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5'>
              Tracking
            </div>
            <div className='font-semibold text-xs sm:text-sm truncate mb-0.5 text-gray-200'>
              {selectedDroneInfo.nickname}
            </div>
            <div className='text-[10px] sm:text-xs text-gray-400 mb-2'>
              SN: {selectedDroneInfo.serialNumber.slice(-8)}
            </div>

            <div className='grid grid-cols-2 gap-1 text-[11px] sm:text-xs'>
              <TelemetryItem
                icon={<Gauge className='w-2.5 h-2.5 sm:w-3 h-3' />}
                label='Alt'
                value={`${selectedDroneInfo.altitude.toFixed(1)} m`}
              />
              <TelemetryItem
                icon={<Wind className='w-2.5 h-2.5 sm:w-3 h-3' />}
                label='Spd'
                value={`${selectedDroneInfo.speed.toFixed(1)} m/s`}
              />
              <TelemetryItem
                icon={<Navigation className='w-2.5 h-2.5 sm:w-3 h-3' />}
                label='Hdg'
                value={`${selectedDroneInfo.direction} ${selectedDroneInfo.heading}°`}
              />
              <TelemetryItem
                icon={<Battery className='w-2.5 h-2.5 sm:w-3 h-3' />}
                label='Bat'
                value={
                  <span className={batteryClass(selectedDroneInfo.battery)}>
                    {selectedDroneInfo.battery}%
                  </span>
                }
              />
            </div>

            <div className='mt-2 pt-1.5 border-t border-gray-700/50 flex justify-between text-[11px] sm:text-xs'>
              <span className='text-gray-400'>Mode</span>
              <span
                className={
                  selectedDroneInfo.modeCode === 1 ? 'text-green-400 font-medium' : 'text-gray-300'
                }
              >
                {selectedDroneInfo.modeCode === 1 ? 'In-flight' : 'Standby'}
              </span>
            </div>
            <div className='mt-1 text-[9px] text-gray-500 font-mono text-right truncate'>
              {selectedDroneInfo.latitude}, {selectedDroneInfo.longitude}
            </div>

            {/* Quick-nav buttons */}
            <div className='mt-2.5 pt-2 border-t border-blue-700/30 grid grid-cols-2 gap-1.5'>
              <Link
                href='/live-feed'
                className='flex items-center justify-center gap-1 px-1 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700/50 hover:bg-[#1C93FF]/15 hover:border-[#1C93FF]/40 text-zinc-400 hover:text-[#1C93FF] transition-colors text-[10px] sm:text-[11px] font-semibold'
              >
                <Video className='w-3 h-3 flex-shrink-0' />
                Live
              </Link>
              <Link
                href='/control'
                className='flex items-center justify-center gap-1 px-1 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 transition-colors text-[10px] sm:text-[11px] font-semibold'
              >
                <Gamepad2 className='w-3 h-3 flex-shrink-0' />
                Control
              </Link>
            </div>
          </div>
        )}

        {/* Live fleet list */}
        {viewMode === 'multi' && (
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
                Live Fleet
              </span>
              <span className='text-[10px] sm:text-xs font-mono text-blue-400'>
                {dronePositionsArray.length} active
              </span>
            </div>

            {dronePositionsArray.length === 0 ? (
              <div className='text-[11px] sm:text-xs text-gray-500 text-center py-4 border border-dashed border-gray-700 rounded-xl'>
                No active drones
              </div>
            ) : (
              <div className='space-y-1.5 max-h-40 sm:max-h-64 overflow-y-auto pr-0.5'>
                {dronePositionsArray.map((drone) => {
                  const t = getProcessedDroneData(drone.sn);
                  const isSelected = drone.sn === selectedSn;

                  return (
                    <button
                      key={drone.sn}
                      onClick={() => (drone.hasGPS ? onFlyToDrone(drone) : undefined)}
                      className={`w-full text-left p-2 rounded-xl text-[11px] sm:text-xs transition-all border outline-none select-none focus:outline-none focus:ring-0 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 outline-none'
                          : drone.hasGPS
                            ? 'border-gray-800 hover:border-gray-600 bg-neutral-900/60 text-gray-200'
                            : 'border-yellow-900/40 bg-neutral-900/40 cursor-default text-gray-400'
                      }`}
                    >
                      <div className='flex justify-between items-center mb-1'>
                        <div className='flex items-center gap-1 min-w-0'>
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${
                              drone.hasGPS ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          />
                          <span className='font-semibold truncate'>{drone.nickname}</span>
                        </div>
                        {t && drone.hasGPS && (
                          <span
                            className={`font-mono flex-shrink-0 font-semibold ${batteryClass(t.battery)}`}
                          >
                            {t.battery}%
                          </span>
                        )}
                      </div>
                      {!drone.hasGPS ? (
                        t?.hasOSD ? (
                          <div className='text-orange-400/90 font-mono text-[9px] sm:text-[10px] truncate'>
                            No GPS fix · {t.gpsNumber} sats
                          </div>
                        ) : (
                          <div className='text-yellow-600/80 font-mono text-[9px] sm:text-[10px]'>
                            Awaiting telemetry…
                          </div>
                        )
                      ) : t ? (
                        <div className='grid grid-cols-3 gap-0.5 text-gray-400 text-[10px] sm:text-[11px]'>
                          <span className='flex items-center gap-0.5 truncate'>
                            <Gauge className='w-2.5 h-2.5' />
                            {t.altitude.toFixed(0)}m
                          </span>
                          <span className='flex items-center gap-0.5 truncate'>
                            <Wind className='w-2.5 h-2.5' />
                            {t.speed.toFixed(1)}m/s
                          </span>
                          <span className='flex items-center gap-0.5 truncate'>
                            <Navigation className='w-2.5 h-2.5' />
                            {t.direction}
                          </span>
                        </div>
                      ) : (
                        <div className='text-gray-600 font-mono text-[10px]'>
                          {drone.sn.slice(-8)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

TelemetryPanel.displayName = 'TelemetryPanel';

function TelemetryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-center gap-0.5 text-gray-300 min-w-0'>
      <span className='text-gray-500 flex-shrink-0'>{icon}</span>
      <span className='text-gray-500 text-[9px] sm:text-[10px] pr-0.5'>{label}</span>
      <span className='ml-auto font-mono text-[10px] sm:text-[11px] truncate'>{value}</span>
    </div>
  );
}
