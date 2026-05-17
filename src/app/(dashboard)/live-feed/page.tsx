'use client';

import { MainLayout } from '@/components/layout/main-layout';
import Modal from '@/components/Modal';
import { RegisterDeviceModal } from '@/components/features/devices/RegisterDeviceModal';
import { EditDeviceModal } from '@/components/features/devices/EditDeviceModal';
import { DroneAPIResponse } from '@/hooks/useDronesWebSocket';
import React, { useState, useMemo } from 'react';
import { UnifiedStream } from '@/lib/types';
import { StreamControlPanel } from '@/components/features/streams/StreamControlPanel';

export const dynamic = 'force-dynamic';

export default function LiveFeedsPage() {
  const [selectedStream, setSelectedStream] = useState<UnifiedStream | null>(null);
  const [selectedMediaStream, setSelectedMediaStream] = useState<MediaStream | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedType, setSelectedFeedType] = useState<'ALL' | 'DRONE' | 'CCTV' | 'BODY CAM'>('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<DroneAPIResponse | null>(null);

  // --- Stub: replace with your endpoint data ---
  const allStreams: UnifiedStream[] = [];
  const isLoading = false;
  const error: Error | null = null;
  // ---------------------------------------------

  const filteredStreams = useMemo(() => {
    let streams = allStreams;
    if (selectedFeedType !== 'ALL') {
      streams = streams.filter((stream) => stream.type === selectedFeedType);
    }
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      streams = streams.filter(
        (stream) =>
          stream.name.toLowerCase().includes(searchLower) ||
          stream.id.toLowerCase().includes(searchLower)
      );
    }
    return streams;
  }, [allStreams, searchTerm, selectedFeedType]);

  const activeStreams = allStreams.filter((s) => s.isOnline).length;
  const totalStreams = allStreams.length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleFeedTypeChange = (feedType: 'ALL' | 'DRONE' | 'CCTV' | 'BODY CAM') => setSelectedFeedType(feedType);
  const handleStreamCardClick = (stream: UnifiedStream, mediaStream: MediaStream | null) => {
    setSelectedStream(stream);
    setSelectedMediaStream(mediaStream);
  };

  return (
    <div className='bg-background text-foreground min-h-screen'>
      <MainLayout title='Live Feeds' subtitle=''>
        {/* Loading State */}
        {isLoading && (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
            <p className='text-gray-400 mt-4'>Loading devices…</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6'>
            <p className='text-red-400'>Failed to load streams: {(error as Error)?.message}</p>
            <button className='mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm'>
              Retry
            </button>
          </div>
        )}

        {/* Search and Filters */}
        {!isLoading && (
          <div className='mb-6 space-y-4'>
            <div className='flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0'>
              {/* Search Input */}
              <div className='flex-1 flex items-center p-3 space-x-2 bg-input rounded-lg focus-within:ring-2 focus-within:ring-blue-500'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 text-gray-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
                <input
                  type='text'
                  placeholder='Search feeds...'
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className='flex-1 text-sm text-gray-300 placeholder-gray-500 bg-transparent outline-none border-none'
                />
              </div>

              {/* Feed Type Dropdown */}
              <div className='relative w-full md:w-48 group'>
                <div className='flex items-center justify-between p-3 bg-input rounded-lg text-sm text-muted-foreground cursor-pointer hover:bg-accent transition'>
                  <span>Feed Type - {selectedFeedType}</span>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 text-gray-400 transform group-hover:rotate-180 transition-transform'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='absolute mt-0.2 w-full md:w-48 bg-card border border-gray-700 rounded-lg shadow-xl z-10 hidden group-hover:block transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100'>
                  {(['ALL', 'DRONE', 'CCTV', 'BODY CAM'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFeedTypeChange(type)}
                      className='block w-full text-left p-3 text-sm text-gray-300 hover:bg-black rounded-lg transition'
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                <span className='text-sm text-gray-400'>
                  {activeStreams} / {totalStreams} Streams Online
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center justify-end space-x-3 mt-4'>
              <button className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center'>
                <i className='fas fa-sync mr-2'></i>
                Refresh
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className='px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center'
              >
                <i className='fas fa-edit mr-2'></i>
                Edit Device
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center'
              >
                <i className='fas fa-plus mr-2'></i>
                Register Device
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area with Right Sidebar */}
        {!isLoading && (
          <div className='flex'>
            {/* Stream Grid */}
            <main className='flex-1 pr-0'>
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto'>
                <Modal>
                  {filteredStreams.length > 0 &&
                    filteredStreams.map((stream) => {
                      const { id, name, type, isOnline } = stream;

                      return (
                        <React.Fragment key={id}>
                          <Modal.Open name={`Stream-${id}`}>
                            <div className='bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700'>
                              <div className='flex items-center justify-between mb-3'>
                                <span
                                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    type === 'DRONE'
                                      ? 'bg-blue-600'
                                      : type === 'BODY CAM'
                                        ? 'bg-purple-600'
                                        : 'bg-green-600'
                                  }`}
                                >
                                  {type}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
                                ></span>
                              </div>
                              <div className='aspect-video bg-black rounded flex items-center justify-center mb-3'>
                                <i
                                  className={`fas ${
                                    type === 'DRONE'
                                      ? 'fa-drone'
                                      : type === 'BODY CAM'
                                        ? 'fa-video'
                                        : 'fa-camera'
                                  } text-4xl text-gray-600`}
                                ></i>
                              </div>
                              <h4 className='font-semibold text-white truncate'>{name}</h4>
                              <p className='text-xs text-gray-400 truncate'>{id}</p>
                            </div>
                          </Modal.Open>
                          <Modal.Window name={`Stream-${id}`} buttonX={true}>
                            <div className='p-6 bg-gray-900 rounded-lg max-w-4xl w-full'>
                              <div className='aspect-video bg-black rounded flex items-center justify-center mb-4'>
                                <div className='text-center'>
                                  <i className='fas fa-video-slash text-4xl text-gray-600 mb-2'></i>
                                  <p className='text-gray-400'>Video Player Component Placeholder</p>
                                  <p className='text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold'>
                                    WebRTC Feed
                                  </p>
                                </div>
                              </div>

                              {type === 'DRONE' && <StreamControlPanel stream={stream.raw} />}

                              <h3 className='text-xl font-bold text-white mb-2'>{name}</h3>
                              <div className='grid grid-cols-2 gap-4 text-sm'>
                                <div>
                                  <p className='text-gray-400'>Serial Number</p>
                                  <p className='text-white'>{id}</p>
                                </div>
                                <div>
                                  <p className='text-gray-400'>Type</p>
                                  <p className='text-white'>{type}</p>
                                </div>
                              </div>
                            </div>
                          </Modal.Window>
                        </React.Fragment>
                      );
                    })}
                </Modal>

                {filteredStreams.length === 0 && allStreams.length === 0 && (
                  <div className='col-span-full text-center py-12'>
                    <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center'>
                      <i className='fas fa-video-slash text-gray-400 text-2xl'></i>
                    </div>
                    <p className='text-gray-400 text-lg font-medium'>No Device Connected</p>
                    <p className='text-gray-500 text-sm mt-2'>
                      No devices found. Ensure devices are bound to the workspace.
                    </p>
                  </div>
                )}

                {filteredStreams.length === 0 && allStreams.length > 0 && (
                  <div className='col-span-full text-center py-12'>
                    <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center'>
                      <i className='fas fa-search text-gray-400 text-2xl'></i>
                    </div>
                    <p className='text-gray-400 text-lg font-medium'>
                      No feeds match your search criteria
                    </p>
                    <p className='text-gray-500 text-sm mt-2'>
                      Try adjusting your search or filter
                    </p>
                  </div>
                )}
              </div>
            </main>

            {/* Recent Incidents Sidebar */}
            <aside className='w-80 p-6 pl-0'>
              <div className='bg-card p-5 shadow-md h-full overflow-y-auto scroll-thin'>
                <h3 className='font-bold mb-4 flex items-center'>
                  <i className='fas fa-exclamation-circle text-red-400 mr-2'></i> Recent Incidents
                </h3>

                <div className='p-4 mb-3 bg-black border-l-4 border-red-500'>
                  <div className='flex justify-between items-center'>
                    <h4 className='font-semibold text-sm'>Crowd formation detected</h4>
                    <span className='bg-red-600 text-[10px] px-2 py-0.5 font-bold'>OPEN</span>
                  </div>
                  <p className='text-gray-400 text-xs mt-1'>
                    Large crowd gathering in market area. AI shows rapid growth.
                  </p>
                  <div className='text-gray-500 text-xs flex items-center mt-2 gap-2'>
                    <i className='fas fa-clock'></i> 20d ago
                    <i className='fas fa-map-marker-alt'></i> Kurmi Market, Kano
                    <i className='fas fa-id-badge'></i> ID: ktxudzsv
                  </div>
                </div>

                <div className='p-4 mb-3 bg-black border-l-4 border-green-500'>
                  <div className='flex justify-between items-center'>
                    <h4 className='font-semibold text-sm'>Vehicle convoy anomaly</h4>
                    <span className='bg-green-600 text-[10px] px-2 py-0.5 font-bold'>RESOLVED</span>
                  </div>
                  <p className='text-gray-400 text-xs mt-1'>
                    Detected unusual convoy on Lagos-Ibadan highway.
                  </p>
                  <div className='text-gray-500 text-xs flex items-center mt-2 gap-2'>
                    <i className='fas fa-clock'></i> 20d ago
                    <i className='fas fa-road'></i> Lagos-Ibadan Expressway
                    <i className='fas fa-id-badge'></i> ID: zmdizjgn
                  </div>
                </div>

                <div className='p-4 mb-3 bg-black border-l-4 border-yellow-400'>
                  <div className='flex justify-between items-center'>
                    <h4 className='font-semibold text-sm'>Pipeline corridor intrusion</h4>
                    <span className='bg-yellow-500 text-[10px] px-2 py-0.5 font-bold'>IN PROGRESS</span>
                  </div>
                  <p className='text-gray-400 text-xs mt-1'>
                    Individuals walking close to restricted pipeline perimeter.
                  </p>
                  <div className='text-gray-500 text-xs flex items-center mt-2 gap-2'>
                    <i className='fas fa-clock'></i> 20d ago
                    <i className='fas fa-map-marker-alt'></i> Lagos-Kano Pipeline
                    <i className='fas fa-id-badge'></i> ID: alx0f0hb
                  </div>
                </div>

                <div className='p-4 mb-3 bg-black border-l-4 border-blue-500'>
                  <div className='flex justify-between items-center'>
                    <h4 className='font-semibold text-sm'>Unauthorized drone activity</h4>
                    <span className='bg-blue-600 text-[10px] px-2 py-0.5 font-bold'>MONITORING</span>
                  </div>
                  <p className='text-gray-400 text-xs mt-1'>
                    Unregistered drone detected in restricted airspace.
                  </p>
                  <div className='text-gray-500 text-xs flex items-center mt-2 gap-2'>
                    <i className='fas fa-clock'></i> 1h ago
                    <i className='fas fa-map-marker-alt'></i> Port Harcourt Airport
                    <i className='fas fa-id-badge'></i> ID: ph2024001
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Modals */}
        <RegisterDeviceModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
        <EditDeviceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          device={deviceToEdit}
        />
      </MainLayout>
    </div>
  );
}
