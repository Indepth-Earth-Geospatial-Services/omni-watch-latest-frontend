'use client';

import React from 'react';
import { Wifi, Battery, MoreHorizontal, Settings, Activity, Box } from 'lucide-react';
import { TabType } from './AssetManagement';

interface Asset {
  id: string;
  name: string;
  type: 'DRONE' | 'DOCK';
  model: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  battery: number;
  signal: number;
  firmware: string;
}

const assets: Asset[] = [
  {
    id: '1',
    name: 'Raptor-07',
    type: 'DRONE',
    model: 'Mavic 3E',
    status: 'ONLINE',
    battery: 87,
    signal: 94,
    firmware: 'v2.04',
  },
  {
    id: '2',
    name: 'NestPoint-03',
    type: 'DOCK',
    model: 'D-Series v2',
    status: 'ONLINE',
    battery: 100,
    signal: 100,
    firmware: 'v1.12',
  },
  {
    id: '3',
    name: 'Alpha-X',
    type: 'DRONE',
    model: 'M300 RTK',
    status: 'MAINTENANCE',
    battery: 45,
    signal: 0,
    firmware: 'v4.01',
  },
  {
    id: '4',
    name: 'Z-Terminal',
    type: 'DOCK',
    model: 'ComLink-A',
    status: 'OFFLINE',
    battery: 0,
    signal: 0,
    firmware: 'v0.98',
  },
];

const AssetTable = ({ activeTab }: { activeTab: TabType }) => {
  const filteredAssets = assets.filter((asset) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Drones') return asset.type === 'DRONE';
    if (activeTab === 'Docks') return asset.type === 'DOCK';
    return true;
  });

  return (
    <div className='w-[calc(100%-1rem)] overflow-hidden bg-[#1D2026] rounded-lg border border-[#4D435426]/15 shadow-2xl mx-2 font-poppins'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left border-collapse min-w-[900px]'>
          <thead>
            <tr className='border-b border-zinc-800/50 bg-[#191C22]'>
              <th className='px-6 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase'>
                Asset Identity
              </th>
              <th className='px-6 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase'>
                Model / Version
              </th>
              <th className='px-6 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase text-center'>
                Connectivity
              </th>
              <th className='px-6 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase text-center'>
                Power
              </th>
              <th className='px-6 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase'>
                Status
              </th>
              <th className='px-6 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase text-right'>
                Manage
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-zinc-800/30'>
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className='hover:bg-white/[0.02] transition-colors group'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center'>
                      {asset.type === 'DRONE' ? (
                        <div className='bg-blue-900/20 w-full h-full flex items-center justify-center text-blue-400'>
                          <Activity size={18} />
                        </div>
                      ) : (
                        <div className='bg-cyan-900/20 w-full h-full flex items-center justify-center text-cyan-400'>
                          <Box size={18} />
                        </div>
                      )}
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-sm font-bold text-zinc-100'>{asset.name}</span>
                      <span className='text-[10px] font-mono text-zinc-500 uppercase tracking-tighter'>
                        UID: {asset.id.padStart(4, '0')}
                      </span>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='flex flex-col'>
                    <span className='text-xs font-medium text-zinc-300'>{asset.model}</span>
                    <span className='text-[10px] font-mono text-zinc-500'>{asset.firmware}</span>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='flex flex-col items-center gap-1'>
                    <div className='flex items-center gap-2'>
                      <Wifi
                        size={14}
                        className={asset.signal > 0 ? 'text-emerald-500' : 'text-zinc-600'}
                      />
                      <span className='text-xs font-mono text-zinc-300'>{asset.signal}%</span>
                    </div>
                    <div className='w-16 h-1 bg-zinc-800 rounded-full overflow-hidden'>
                      <div className='h-full bg-blue-500' style={{ width: `${asset.signal}%` }} />
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='flex flex-col items-center gap-1'>
                    <div className='flex items-center gap-2'>
                      <Battery
                        size={14}
                        className={asset.battery > 20 ? 'text-emerald-500' : 'text-red-500'}
                      />
                      <span className='text-xs font-mono text-zinc-300'>{asset.battery}%</span>
                    </div>
                    <div className='w-16 h-1 bg-zinc-800 rounded-full overflow-hidden'>
                      <div
                        className={`h-full ${asset.battery > 20 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${asset.battery}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border
                    ${asset.status === 'ONLINE' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className='px-6 py-4 text-right'>
                  <div className='flex justify-end gap-2'>
                    <button className='p-2 text-zinc-500 hover:text-white'>
                      <Settings size={14} />
                    </button>
                    <button className='p-2 text-zinc-500 hover:text-white'>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetTable;
