'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, Plane } from 'lucide-react';
import type { Wayline } from '@/lib/types';
import type { ProjectDevice } from '@/lib/types';
import type { CreateFlightTask } from '@/lib/types';

interface CreatePlanFormProps {
  onSubmit: (body: CreateFlightTask) => void;
  onCancel: () => void;
  isPending: boolean;
  projectWaylines: Wayline[];
  projectDevices: ProjectDevice[];
}

const lostActionOptions = [
  { value: 0, label: 'Return to Home' },
  { value: 1, label: 'Hover' },
  { value: 2, label: 'Land' },
];

export function CreatePlanForm({
  onSubmit,
  onCancel,
  isPending,
  projectWaylines,
  projectDevices,
}: CreatePlanFormProps) {
  const [planName, setPlanName] = useState('');
  const [waylineId, setWaylineId] = useState('');
  const [deviceSn, setDeviceSn] = useState('');
  const [taskType, setTaskType] = useState(0);
  const [executeDate, setExecuteDate] = useState('');
  const [executeTime, setExecuteTime] = useState('');
  const [rthAltitude, setRthAltitude] = useState(100);
  const [lostAction, setLostAction] = useState(0);
  const [minBattery, setMinBattery] = useState(30);
  const [minStorage, setMinStorage] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!planName.trim()) newErrors.planName = 'Plan name is required';
    if (!waylineId) newErrors.waylineId = 'Flight route is required';
    if (!deviceSn) newErrors.deviceSn = 'Device is required';
    if (rthAltitude < 20 || rthAltitude > 1500) newErrors.rthAltitude = 'Must be between 20 and 1500';
    if (taskType === 1 || taskType === 2) {
      if (!executeDate) newErrors.executeDate = 'Date is required';
      if (!executeTime) newErrors.executeTime = 'Time is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const selectedWayline = projectWaylines.find((w) => w.id === waylineId);

    const body: CreateFlightTask = {
      name: planName.trim(),
      file_id: waylineId,
      task_type: taskType,
      way_point_type: 0,
      out_of_control_action: lostAction,
      rth_altitude: rthAltitude,
      device_sn: deviceSn,
      wayline_type: selectedWayline?.template_types?.[0] ?? 0,
    };

    if (taskType === 1 || taskType === 2) {
      const dt = new Date(`${executeDate}T${executeTime}`);
      body.execute_time = dt.getTime();
    }

    if (taskType === 2) {
      body.min_battery_capacity = minBattery;
      body.min_storage_capacity = minStorage;
    }

    onSubmit(body);
  }

  return (
    <form onSubmit={handleSubmit} className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl p-6 space-y-6 max-w-2xl'>
      <div className='flex items-center gap-3 mb-2'>
        <Plane className='w-5 h-5 text-sky-400' />
        <h3 className='text-sm font-semibold text-zinc-200'>Create Flight Plan</h3>
      </div>

      {/* Plan Name */}
      <div>
        <label className='block text-xs text-zinc-400 mb-1.5'>Plan Name *</label>
        <input
          type='text'
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder='e.g., Survey Mission Alpha'
          className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sky-500'
        />
        {errors.planName && <p className='text-red-400 text-[10px] mt-1'>{errors.planName}</p>}
      </div>

      {/* Flight Route */}
      <div>
        <label className='block text-xs text-zinc-400 mb-1.5'>Flight Route *</label>
        <select
          value={waylineId}
          onChange={(e) => setWaylineId(e.target.value)}
          className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
        >
          <option value=''>Select a wayline...</option>
          {projectWaylines.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {errors.waylineId && <p className='text-red-400 text-[10px] mt-1'>{errors.waylineId}</p>}
      </div>

      {/* Device */}
      <div>
        <label className='block text-xs text-zinc-400 mb-1.5'>Device *</label>
        <select
          value={deviceSn}
          onChange={(e) => setDeviceSn(e.target.value)}
          className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
        >
          <option value=''>Select a device...</option>
          {projectDevices.map((pd) => (
            <option key={pd.device.device_sn} value={pd.device.device_sn}>
              {pd.device.name} ({pd.device.device_sn})
            </option>
          ))}
        </select>
        {errors.deviceSn && <p className='text-red-400 text-[10px] mt-1'>{errors.deviceSn}</p>}
      </div>

      {/* Plan Timer */}
      <div>
        <label className='block text-xs text-zinc-400 mb-2'>Plan Timer *</label>
        <div className='flex gap-3'>
          {[
            { value: 0, label: 'Immediate' },
            { value: 1, label: 'Timed' },
            { value: 2, label: 'Conditional' },
          ].map((opt) => (
            <button
              key={opt.value}
              type='button'
              onClick={() => setTaskType(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                taskType === opt.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date/Time pickers for Timed/Conditional */}
      {(taskType === 1 || taskType === 2) && (
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-zinc-400 mb-1.5'>Date *</label>
            <input
              type='date'
              value={executeDate}
              onChange={(e) => setExecuteDate(e.target.value)}
              className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
            />
            {errors.executeDate && <p className='text-red-400 text-[10px] mt-1'>{errors.executeDate}</p>}
          </div>
          <div>
            <label className='block text-xs text-zinc-400 mb-1.5'>Time *</label>
            <input
              type='time'
              value={executeTime}
              onChange={(e) => setExecuteTime(e.target.value)}
              className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
            />
            {errors.executeTime && <p className='text-red-400 text-[10px] mt-1'>{errors.executeTime}</p>}
          </div>
        </div>
      )}

      {/* RTH Altitude */}
      <div>
        <label className='block text-xs text-zinc-400 mb-1.5'>RTH Altitude (20-1500m) *</label>
        <input
          type='number'
          min={20}
          max={1500}
          value={rthAltitude}
          onChange={(e) => setRthAltitude(Number(e.target.value))}
          className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
        />
        {errors.rthAltitude && <p className='text-red-400 text-[10px] mt-1'>{errors.rthAltitude}</p>}
      </div>

      {/* Lost Action */}
      <div>
        <label className='block text-xs text-zinc-400 mb-2'>Lost Action *</label>
        <div className='flex gap-3'>
          {lostActionOptions.map((opt) => (
            <button
              key={opt.value}
              type='button'
              onClick={() => setLostAction(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                lostAction === opt.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional thresholds */}
      {taskType === 2 && (
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-zinc-400 mb-1.5'>Battery Level Threshold (%)</label>
            <input
              type='number'
              min={0}
              max={100}
              value={minBattery}
              onChange={(e) => setMinBattery(Number(e.target.value))}
              className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
            />
          </div>
          <div>
            <label className='block text-xs text-zinc-400 mb-1.5'>Storage Level Threshold (%)</label>
            <input
              type='number'
              min={0}
              max={100}
              value={minStorage}
              onChange={(e) => setMinStorage(Number(e.target.value))}
              className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-sky-500'
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center gap-3 pt-2'>
        <button
          type='button'
          onClick={onCancel}
          className='flex items-center gap-2 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          Back
        </button>
        <button
          type='submit'
          disabled={isPending}
          className='flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50'
        >
          {isPending ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              Creating...
            </>
          ) : (
            'Create Plan'
          )}
        </button>
      </div>
    </form>
  );
}
