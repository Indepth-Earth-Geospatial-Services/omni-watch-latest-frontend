// Multi-step Registration Modal for Devices (Drone/Body Cam/CCTV)
"use client";

import React, { useState, useEffect } from 'react';
import { createDrone, CreateDronePayload } from '@/services/api/drone-api';
import { useUnregisteredDevices } from '@/hooks/useUnregisteredDevices';
import { SURVEILLANCE_CLASSES } from '@/constants/yolo-classes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RegisterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeviceType = 'DRONE' | 'BODY CAM' | 'CCTV';
type Step = 'device-type' | 'device-info' | 'incident-classes' | 'confirm';

export function RegisterDeviceModal({ isOpen, onClose }: RegisterDeviceModalProps) {
  const [step, setStep] = useState<Step>('device-type');
  const [deviceType, setDeviceType] = useState<DeviceType>('DRONE');
  const { unregisteredDevices } = useUnregisteredDevices();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<{
    serialNumber: string;
    deviceName: string;
    alias: string;
    description: string;
    camera: string[];
    streamUrl: string;
    userName: string;
    password: string;
    port: string;
    useAI: boolean;
    selectedClasses: number[];
  }>({
    serialNumber: '',
    deviceName: '',
    alias: '',
    description: '',
    camera: [],
    streamUrl: '',
    userName: '',
    password: '',
    port: '8554',
    useAI: false,
    selectedClasses: [],
});


  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutation for creating drone
  const createMutation = useMutation({
    mutationFn: (payload: CreateDronePayload) => createDrone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drones'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || 'Failed to register device' });
    },
  });

  const resetForm = () => {
    setStep('device-type');
    setDeviceType('DRONE');
    setFormData({
      serialNumber: '',
      deviceName: '',
      alias: '',
      description: '',
      camera: [],
      streamUrl: '',
      userName: '',
      password: '',
      port: '8554',
      useAI: false,
      selectedClasses: [],
    });
    setErrors({});
  };

  // Auto-populate device name when serial number is selected (for DRONE only)
  useEffect(() => {
    if (deviceType === 'DRONE' && formData.serialNumber) {
      const device = unregisteredDevices.find(d => d.serialNumber === formData.serialNumber);
      if (device) {
        setFormData(prev => ({
          ...prev,
          deviceName: device.deviceName,
          alias: `Drone-${formData.serialNumber.substring(0, 6)}`,
          description: `Drone device registered on ${new Date().toLocaleDateString()}`,
          camera: device.telemetryData.data.cameras.map((cam: any) => cam.payload_index),
        }));
      }
      console.log('Selected device:', device);
    }
  }, [formData.serialNumber, deviceType, unregisteredDevices]);

  // Pre-populate defaults when device type changes to Body Cam or CCTV
  useEffect(() => {
    if (deviceType !== 'DRONE' && !formData.deviceName) {
      const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      setFormData(prev => ({
        ...prev,
        deviceName: `${deviceType} ${randomId}`,
        alias: `${deviceType.replace(' ', '')}-${randomId}`,
        description: `${deviceType} device registered on ${new Date().toLocaleDateString()}`,
      }));
    }
  }, [deviceType]);

  const handleNext = () => {
    // Validate current step
    const newErrors: Record<string, string> = {};

    if (step === 'device-info') {
      if (!formData.deviceName.trim()) newErrors.deviceName = 'Device name is required';
      if (!formData.alias.trim()) newErrors.alias = 'Alias is required';

      if (deviceType === 'DRONE') {
        if (!formData.serialNumber) newErrors.serialNumber = 'Serial number is required';
      } else {
        if (!formData.streamUrl.trim()) newErrors.streamUrl = 'Stream URL is required';
      }

      if (formData.useAI) {
        if (!formData.userName.trim()) newErrors.userName = 'Username is required for AI detection';
        if (!formData.password.trim()) newErrors.password = 'Password is required for AI detection';
      }
    }

    if (step === 'incident-classes' && formData.useAI) {
      if (formData.selectedClasses.length === 0) {
        newErrors.selectedClasses = 'Please select at least one incident class';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Navigate to next step
    if (step === 'device-type') {
      setStep('device-info');
    } else if (step === 'device-info') {
      if (formData.useAI) {
        setStep('incident-classes');
      } else {
        setStep('confirm');
      }
    } else if (step === 'incident-classes') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'device-info') {
      setStep('device-type');
    } else if (step === 'incident-classes') {
      setStep('device-info');
    } else if (step === 'confirm') {
      if (formData.useAI) {
        setStep('incident-classes');
      } else {
        setStep('device-info');
      }
    }
  };

  const handleSubmit = async () => {
    // Generate unique serial number for Body Cam and CCTV if not already set
    let finalSerialNumber = formData.serialNumber;
    if (deviceType !== 'DRONE' && !finalSerialNumber) {
      // Generate format: BODYCAM-XXXXXX or CCTV-XXXXXX
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalSerialNumber = `${deviceType.replace(' ', '')}-${timestamp}-${random}`;
    }

    // For drones, streamUrl might be empty initially (set when stream is available)
    // For Body Cam/CCTV, streamUrl is the RTSP/RTMP URL they provided
    const streamUrl = deviceType === 'DRONE' ? '' : formData.streamUrl;

    const payload: CreateDronePayload = {
      deviceSerialNumber: finalSerialNumber,
      deviceName: formData.deviceName,
      deviceCategory: deviceType,
      isUsingAiDetection: formData.useAI,
      streamIsOn: false,
      streamUrl: streamUrl,
      metadata: {
        alias: formData.alias,
        description: formData.description,
      },
      streamCredentials: {
        userName: formData.useAI ? formData.userName : '',
        password: formData.useAI ? formData.password : '',
        port: formData.useAI ? formData.port : '8554',
      },
      cameras: formData.camera, // Camera IDs (kept for backward compatibility)
      detectionClasses: formData.useAI ? formData.selectedClasses : [], // YOLO class IDs as numbers
    };

    console.log('Submitting device registration:', payload);
    createMutation.mutate(payload);
  };

  const toggleClass = (classId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter(id => id !== classId)
        : [...prev.selectedClasses, classId],
    }));
  };

  const selectAllByCategory = (category: 'person' | 'vehicle' | 'object') => {
    const categoryClasses = SURVEILLANCE_CLASSES
      .filter(c => c.category === category)
      .map(c => c.id);

    setFormData(prev => {
      const allSelected = categoryClasses.every(id => prev.selectedClasses.includes(id));
      return {
        ...prev,
        selectedClasses: allSelected
          ? prev.selectedClasses.filter(id => !categoryClasses.includes(id))
          : Array.from(new Set([...prev.selectedClasses, ...categoryClasses])),
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Register New Device</h2>
            <p className="text-sm text-gray-400 mt-1">
              Step {step === 'device-type' ? '1' : step === 'device-info' ? '2' : step === 'incident-classes' ? '3' : '4'} of {formData.useAI ? '4' : '3'}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className={step === 'device-type' ? 'text-blue-400 font-medium' : ''}>Device Type</span>
            <span className={step === 'device-info' ? 'text-blue-400 font-medium' : ''}>Device Info</span>
            {formData.useAI && <span className={step === 'incident-classes' ? 'text-blue-400 font-medium' : ''}>Incident Classes</span>}
            <span className={step === 'confirm' ? 'text-blue-400 font-medium' : ''}>Confirm</span>
          </div>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: step === 'device-type' ? '25%' : step === 'device-info' ? '50%' : step === 'incident-classes' ? '75%' : '100%'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 'device-type' && <DeviceTypeStep deviceType={deviceType} setDeviceType={setDeviceType} />}
          {step === 'device-info' && (
            <DeviceInfoStep
              deviceType={deviceType}
              formData={formData}
              setFormData={setFormData}
              unregisteredDevices={unregisteredDevices}
              errors={errors}
            />
          )}
          {step === 'incident-classes' && (
            <IncidentClassesStep
              formData={formData}
              toggleClass={toggleClass}
              selectAllByCategory={selectAllByCategory}
              errors={errors}
            />
          )}
          {step === 'confirm' && <ConfirmStep formData={formData} deviceType={deviceType} />}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="px-6 pb-4">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {errors.submit}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === 'device-type' ? () => { resetForm(); onClose(); } : handleBack}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            {step === 'device-type' ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={step === 'confirm' ? handleSubmit : handleNext}
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Registering...
              </>
            ) : step === 'confirm' ? (
              <>
                <i className="fas fa-check mr-2"></i>
                Register Device
              </>
            ) : (
              <>
                Next
                <i className="fas fa-arrow-right ml-2"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 1: Device Type Selection
function DeviceTypeStep({
  deviceType,
  setDeviceType,
}: {
  deviceType: DeviceType;
  setDeviceType: (type: DeviceType) => void;
}) {
  const deviceTypes: { type: DeviceType; icon: string; title: string; description: string }[] = [
    {
      type: 'DRONE',
      icon: 'fa-drone',
      title: 'Drone',
      description: 'Register a drone device with telemetry tracking',
    },
    {
      type: 'BODY CAM',
      icon: 'fa-video',
      title: 'Body Camera',
      description: 'Register a wearable body camera for personnel',
    },
    {
      type: 'CCTV',
      icon: 'fa-camera',
      title: 'CCTV Camera',
      description: 'Register a fixed CCTV surveillance camera',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-white mb-2">Select Device Type</h3>
        <p className="text-gray-400">Choose the type of device you want to register</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {deviceTypes.map((dt) => (
          <button
            key={dt.type}
            onClick={() => setDeviceType(dt.type)}
            className={`p-6 rounded-lg border-2 transition-all ${
              deviceType === dt.type
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  deviceType === dt.type ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                <i className={`fas ${dt.icon} text-2xl text-white`}></i>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">{dt.title}</h4>
                <p className="text-sm text-gray-400">{dt.description}</p>
              </div>
              {deviceType === dt.type && (
                <div className="mt-2">
                  <i className="fas fa-check-circle text-blue-500"></i>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 2: Device Information
function DeviceInfoStep({
  deviceType,
  formData,
  setFormData,
  unregisteredDevices,
  errors,
}: any) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Device Information</h3>
        <p className="text-gray-400">Provide details about the device</p>
      </div>

      {/* Serial Number or Stream URL */}
      {deviceType === 'DRONE' ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <i className="fas fa-barcode mr-2 text-blue-500"></i>
            Select Serial Number
          </label>
          {unregisteredDevices.length > 0 ? (
            <select
              value={formData.serialNumber}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, serialNumber: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select an unregistered device...</option>
              {unregisteredDevices.map((device: any) => (
                <option key={device.serialNumber} value={device.serialNumber}>
                  {device.serialNumber} - {device.deviceName}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              No unregistered drones detected. Make sure the drone is sending telemetry data.
            </div>
          )}
          {errors.serialNumber && <p className="text-red-400 text-sm mt-1">{errors.serialNumber}</p>}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <i className="fas fa-link mr-2 text-blue-500"></i>
            Stream URL (RTSP/RTMP)
          </label>
          <input
            type="text"
            value={formData.streamUrl}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, streamUrl: e.target.value }))}
            placeholder="rtsp://username:password@192.168.1.100:554/stream"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          {errors.streamUrl && <p className="text-red-400 text-sm mt-1">{errors.streamUrl}</p>}
        </div>
      )}

      {/* Device Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <i className="fas fa-tag mr-2 text-blue-500"></i>
          Device Name
        </label>
        <input
          type="text"
          value={formData.deviceName}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, deviceName: e.target.value }))}
          placeholder="e.g., Drone Alpha"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        />
        {errors.deviceName && <p className="text-red-400 text-sm mt-1">{errors.deviceName}</p>}
      </div>

      {/* Alias */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <i className="fas fa-signature mr-2 text-blue-500"></i>
          Alias
        </label>
        <input
          type="text"
          value={formData.alias}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, alias: e.target.value }))}
          placeholder="e.g., Alpha-01"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        />
        {errors.alias && <p className="text-red-400 text-sm mt-1">{errors.alias}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <i className="fas fa-align-left mr-2 text-blue-500"></i>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
          placeholder="Device description..."
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Use AI Detection */}
      <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-white font-medium">
              <i className="fas fa-brain mr-2 text-purple-500"></i>
              Enable AI Detection
            </span>
            <p className="text-sm text-gray-400 mt-1">Use YOLO for real-time object detection</p>
          </div>
          <input
            type="checkbox"
            checked={formData.useAI}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, useAI: e.target.checked }))}
            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
        </label>
      </div>

      {/* Stream Credentials (shown if AI is enabled) */}
      {formData.useAI && (
        <div className="space-y-4 p-4 bg-purple-900/10 border border-purple-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-purple-400 mb-3">
            <i className="fas fa-key mr-2"></i>
            Stream Credentials (Required for AI)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, userName: e.target.value }))}
                placeholder="Stream username"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
              {errors.userName && <p className="text-red-400 text-sm mt-1">{errors.userName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
                placeholder="Stream password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
            <input
              type="text"
              value={formData.port}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, port: e.target.value }))}
              placeholder="8554"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Step 3: Incident Classes Selection
function IncidentClassesStep({ formData, toggleClass, selectAllByCategory, errors }: any) {
  const personClasses = SURVEILLANCE_CLASSES.filter(c => c.category === 'person');
  const vehicleClasses = SURVEILLANCE_CLASSES.filter(c => c.category === 'vehicle');
  const objectClasses = SURVEILLANCE_CLASSES.filter(c => c.category === 'object');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          <i className="fas fa-brain mr-2 text-purple-500"></i>
          Select Incidents for AI to Track
        </h3>
        <p className="text-gray-400">Choose which objects should trigger incident detection</p>
      </div>

      {errors.selectedClasses && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {errors.selectedClasses}
        </div>
      )}

      {/* Person Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-white flex items-center">
            <i className="fas fa-user text-red-500 mr-2"></i>
            Person
          </h4>
          <button
            onClick={() => selectAllByCategory('person')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {personClasses.map((cls) => (
            <ClassButton key={cls.id} cls={cls} selected={formData.selectedClasses.includes(cls.id)} onClick={() => toggleClass(cls.id)} />
          ))}
        </div>
      </div>

      {/* Vehicle Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-white flex items-center">
            <i className="fas fa-car text-blue-500 mr-2"></i>
            Vehicles
          </h4>
          <button
            onClick={() => selectAllByCategory('vehicle')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {vehicleClasses.map((cls) => (
            <ClassButton key={cls.id} cls={cls} selected={formData.selectedClasses.includes(cls.id)} onClick={() => toggleClass(cls.id)} />
          ))}
        </div>
      </div>

      {/* Object Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-white flex items-center">
            <i className="fas fa-box text-yellow-500 mr-2"></i>
            Objects
          </h4>
          <button
            onClick={() => selectAllByCategory('object')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {objectClasses.map((cls) => (
            <ClassButton key={cls.id} cls={cls} selected={formData.selectedClasses.includes(cls.id)} onClick={() => toggleClass(cls.id)} />
          ))}
        </div>
      </div>

      {/* Selected Count */}
      <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
        <p className="text-blue-400 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          <strong>{formData.selectedClasses.length}</strong> incident{formData.selectedClasses.length !== 1 ? 's' : ''} selected
        </p>
      </div>
    </div>
  );
}

// Class Selection Button
function ClassButton({ cls, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 transition-all ${
        selected
          ? `border-${cls.color}-500 bg-${cls.color}-500/10`
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center space-x-2">
        <i className={`fas ${cls.icon} ${selected ? `text-${cls.color}-400` : 'text-gray-400'}`}></i>
        <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-400'}`}>{cls.name}</span>
        {selected && <i className={`fas fa-check-circle text-${cls.color}-500 ml-auto`}></i>}
      </div>
    </button>
  );
}

// Step 4: Confirmation
function ConfirmStep({ formData, deviceType }: any) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          <i className="fas fa-check-circle mr-2 text-green-500"></i>
          Confirm Registration
        </h3>
        <p className="text-gray-400">Review the device details before registering</p>
      </div>

      <div className="space-y-4">
        <InfoRow label="Device Type" value={deviceType} icon="fa-layer-group" />
        <InfoRow label="Device Name" value={formData.deviceName} icon="fa-tag" />
        <InfoRow label="Alias" value={formData.alias} icon="fa-signature" />
        {deviceType === 'DRONE' && <InfoRow label="Serial Number" value={formData.serialNumber} icon="fa-barcode" />}
        {deviceType !== 'DRONE' && <InfoRow label="Stream URL" value={formData.streamUrl} icon="fa-link" />}
        <InfoRow label="Description" value={formData.description} icon="fa-align-left" />
        <InfoRow
          label="AI Detection"
          value={formData.useAI ? 'Enabled' : 'Disabled'}
          icon="fa-brain"
          valueColor={formData.useAI ? 'text-green-400' : 'text-gray-400'}
        />
        {formData.useAI && (
          <>
            <InfoRow label="Stream Username" value={formData.userName} icon="fa-user" />
            <InfoRow label="Stream Port" value={formData.port} icon="fa-network-wired" />
            <InfoRow
              label="Incident Classes"
              value={`${formData.selectedClasses.length} selected`}
              icon="fa-list"
              valueColor="text-purple-400"
            />
          </>
        )}
      </div>

      {formData.useAI && formData.selectedClasses.length > 0 && (
        <div className="p-4 bg-purple-900/10 border border-purple-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-purple-400 mb-3">
            <i className="fas fa-brain mr-2"></i>
            Selected Incident Classes
          </h4>
          <div className="flex flex-wrap gap-2">
            {formData.selectedClasses.map((classId: number) => {
              const cls = SURVEILLANCE_CLASSES.find(c => c.id === classId);
              return cls ? (
                <span key={cls.id} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-full text-sm text-gray-300">
                  <i className={`fas ${cls.icon} mr-1`}></i>
                  {cls.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
        <p className="text-green-400 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          Click "Register Device" to add this device to your surveillance system
        </p>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, icon, valueColor = 'text-white' }: any) {
  return (
    <div className="flex items-start justify-between p-3 bg-gray-800 rounded-lg">
      <span className="text-gray-400 text-sm flex items-center">
        <i className={`fas ${icon} mr-2 text-blue-500`}></i>
        {label}
      </span>
      <span className={`text-sm font-medium ${valueColor} text-right max-w-md break-words`}>{value}</span>
    </div>
  );
}
