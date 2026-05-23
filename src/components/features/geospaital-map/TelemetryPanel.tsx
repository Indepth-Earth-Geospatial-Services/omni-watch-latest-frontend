'use client';
import { memo } from 'react';
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
  }: TelemetryPanelProps) => (
    <div className='absolute top-4 right-4 bg-neutral-950/95 backdrop-blur-sm border border-gray-800 p-4 rounded-xl shadow-2xl z-10 w-72 max-h-[calc(100%-2rem)] overflow-y-auto space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <LayoutTemplate className='w-4 h-4 text-blue-400' />
        <h3 className='font-semibold text-sm flex-1'>Map Controls</h3>
      </div>

      {/* View mode toggle — Single vs Multi */}
      <div>
        <label className='block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
          View Mode
        </label>
        <div className='flex rounded-lg overflow-hidden border border-gray-700'>
          <button
            onClick={() => onViewModeChange('multi')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs transition-colors ${
              viewMode === 'multi'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-900 text-gray-400 hover:text-white'
            }`}
          >
            <Users className='w-3.5 h-3.5' />
            Fleet
          </button>
          <button
            onClick={() => onViewModeChange('single')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs transition-colors ${
              viewMode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-900 text-gray-400 hover:text-white'
            }`}
          >
            <Crosshair className='w-3.5 h-3.5' />
            Single
          </button>
        </div>
        {viewMode === 'single' && !selectedSn && (
          <p className='text-[10px] text-yellow-500 mt-1 text-center'>
            Click a drone marker to track it
          </p>
        )}
      </div>

      {/* Draw mode — Add Element */}
      <button
        onClick={onToggleDrawMode}
        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border transition-colors ${
          isDrawMode
            ? 'border-blue-600 bg-blue-600/20 text-blue-400 animate-pulse'
            : 'border-gray-700 bg-neutral-900 text-gray-400 hover:text-white hover:border-gray-500'
        }`}
      >
        <MapPin className='w-3.5 h-3.5' />
        {isDrawMode ? 'Drawing Active — click map…' : 'Add Element to Layer'}
      </button>

      {/* Basemap switcher */}
      <div>
        <label className='block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
          Basemap
        </label>
        <select
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value)}
          className='w-full p-2 border border-gray-700 bg-neutral-900 rounded-lg text-sm'
        >
          <option value='dark'>Dark</option>
          <option value='positron'>Positron</option>
          <option value='satellite'>Satellite</option>
        </select>
      </div>

      {/* Layer toggles */}
      <div>
        <label className='block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
          Layers
        </label>
        <label className='flex items-center gap-2 text-sm cursor-pointer select-none'>
          <input
            type='checkbox'
            checked={showElements}
            onChange={(e) => onShowElementsChange(e.target.checked)}
            className='rounded border-gray-700 bg-neutral-800'
          />
          <Layers className='w-3.5 h-3.5 text-gray-400' />
          <span>Map Elements ({elementCount})</span>
        </label>
      </div>

      {/* Action buttons */}
      <div className='flex gap-2'>
        <button
          onClick={onFitToAllDrones}
          disabled={dronePositionsArray.length === 0}
          className='flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-1.5 px-2 rounded-lg text-xs transition-colors'
        >
          <ZoomIn className='w-3.5 h-3.5' />
          Zoom All
        </button>

        {DJI_CONFIG.USE_DJI_CLOUD && (
          <button
            onClick={() =>
              onSyncGeofences({ device_sn: boundDevices.map((d) => d.deviceSn) })
            }
            disabled={isSyncing || boundDevices.length === 0}
            className='flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-1.5 px-2 rounded-lg text-xs transition-colors'
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing…' : `Sync (${flightAreas.length})`}
          </button>
        )}
      </div>

      {/* Selected drone detail card */}
      {selectedDroneInfo && (
        <div className='border border-blue-700/50 rounded-xl p-3 bg-blue-950/20'>
          <div className='text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1'>
            Tracking
          </div>
          <div className='font-semibold text-sm truncate mb-0.5'>{selectedDroneInfo.nickname}</div>
          <div className='text-xs text-gray-400 mb-3'>SN: {selectedDroneInfo.serialNumber.slice(-8)}</div>

          <div className='grid grid-cols-2 gap-1.5 text-xs'>
            <TelemetryItem
              icon={<Gauge className='w-3 h-3' />}
              label='Alt'
              value={`${selectedDroneInfo.altitude.toFixed(1)} m`}
            />
            <TelemetryItem
              icon={<Wind className='w-3 h-3' />}
              label='Spd'
              value={`${selectedDroneInfo.speed.toFixed(1)} m/s`}
            />
            <TelemetryItem
              icon={<Navigation className='w-3 h-3' />}
              label='Hdg'
              value={`${selectedDroneInfo.direction} ${selectedDroneInfo.heading}°`}
            />
            <TelemetryItem
              icon={<Battery className='w-3 h-3' />}
              label='Bat'
              value={
                <span className={batteryClass(selectedDroneInfo.battery)}>
                  {selectedDroneInfo.battery}%
                </span>
              }
            />
          </div>

          <div className='mt-2 pt-2 border-t border-gray-700/50 flex justify-between text-xs'>
            <span className='text-gray-400'>Mode</span>
            <span
              className={
                selectedDroneInfo.modeCode === 1 ? 'text-green-400' : 'text-gray-300'
              }
            >
              {selectedDroneInfo.modeCode === 1 ? 'In-flight' : 'Standby'}
            </span>
          </div>
          <div className='mt-1 text-[10px] text-gray-500 font-mono text-right'>
            {selectedDroneInfo.latitude}, {selectedDroneInfo.longitude}
          </div>
        </div>
      )}

      {/* Live fleet list — always shown in multi mode, collapsed in single */}
      {viewMode === 'multi' && (
        <div>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
              Live Fleet
            </span>
            <span className='text-xs font-mono text-blue-400'>{dronePositionsArray.length} active</span>
          </div>

          {dronePositionsArray.length === 0 ? (
            <div className='text-xs text-gray-500 text-center py-5 border border-dashed border-gray-700 rounded-xl'>
              No drones tracked yet
            </div>
          ) : (
            <div className='space-y-2 max-h-64 overflow-y-auto pr-0.5'>
              {dronePositionsArray.map((drone) => {
                const t = getProcessedDroneData(drone.sn);
                const isSelected = drone.sn === selectedSn;

                return (
                  <button
                    key={drone.sn}
                    onClick={() => drone.hasGPS ? onFlyToDrone(drone) : undefined}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-950/40'
                        : drone.hasGPS
                          ? 'border-gray-800 hover:border-gray-600 bg-neutral-900/60'
                          : 'border-yellow-900/40 bg-neutral-900/40 cursor-default'
                    }`}
                  >
                    <div className='flex justify-between items-center mb-1.5'>
                      <div className='flex items-center gap-1.5 min-w-0'>
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${
                            drone.hasGPS ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                        />
                        <span className='font-semibold truncate'>{drone.nickname}</span>
                      </div>
                      {t && drone.hasGPS && (
                        <span className={`font-mono flex-shrink-0 font-semibold ${batteryClass(t.battery)}`}>
                          {t.battery}%
                        </span>
                      )}
                    </div>
                    {!drone.hasGPS ? (
                      t?.hasOSD ? (
                        <div className='text-orange-400/90 font-mono text-[10px]'>
                          No GPS fix · {t.gpsNumber} sat{t.gpsNumber !== 1 ? 's' : ''} visible
                        </div>
                      ) : (
                        <div className='text-yellow-600/80 font-mono text-[10px]'>Awaiting telemetry…</div>
                      )
                    ) : t ? (
                      <div className='grid grid-cols-3 gap-1 text-gray-400'>
                        <span className='flex items-center gap-0.5'>
                          <Gauge className='w-2.5 h-2.5' />
                          {t.altitude.toFixed(0)}m
                        </span>
                        <span className='flex items-center gap-0.5'>
                          <Wind className='w-2.5 h-2.5' />
                          {t.speed.toFixed(1)}m/s
                        </span>
                        <span className='flex items-center gap-0.5'>
                          <Navigation className='w-2.5 h-2.5' />
                          {t.direction}
                        </span>
                      </div>
                    ) : (
                      <div className='text-gray-600 font-mono'>{drone.sn.slice(-8)}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
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
    <div className='flex items-center gap-1 text-gray-300'>
      <span className='text-gray-500'>{icon}</span>
      <span className='text-gray-500 text-[10px]'>{label}</span>
      <span className='ml-auto font-mono text-[11px]'>{value}</span>
    </div>
  );
}
