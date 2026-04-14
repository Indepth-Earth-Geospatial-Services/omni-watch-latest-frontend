// Edit Device Modal - Edit existing device configuration
"use client";

import React, { useState, useEffect } from 'react';
import { updateDrone, UpdateDronePayload, DroneAPIResponse } from '@/services/api/drone-api';
import { SURVEILLANCE_CLASSES } from '@/constants/yolo-classes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DroneAPIResponse | null;
}

export function EditDeviceModal({ isOpen, onClose, device }: EditDeviceModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    deviceName: '',
    alias: '',
    description: '',
    streamUrl: '',
    userName: '',
    password: '',
    port: '8554',
    useAI: false,
    streamIsOn: false,
    selectedClasses: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load device data when modal opens
  useEffect(() => {
    if (device && isOpen) {
      setFormData({
        deviceName: device.deviceName,
        alias: device.metadata?.alias || '',
        description: device.metadata?.description || '',
        streamUrl: device.streamUrl,
        userName: device.streamCredentials?.userName || '',
        password: device.streamCredentials?.password || '',
        port: device.streamCredentials?.port || '8554',
        useAI: device.isUsingAiDetection,
        streamIsOn: device.streamIsOn,
        selectedClasses: device.detectionClasses || [],
      });
    }
  }, [device, isOpen]);

  // Mutation for updating drone
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateDronePayload) => {
      if (!device) throw new Error('No device selected');
      return updateDrone(device.deviceSerialNumber, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drones'] });
      onClose();
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || 'Failed to update device' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.deviceName.trim()) newErrors.deviceName = 'Device name is required';
    if (!formData.alias.trim()) newErrors.alias = 'Alias is required';

    if (formData.useAI) {
      if (!formData.userName.trim()) newErrors.userName = 'Username is required for AI detection';
      if (!formData.password.trim()) newErrors.password = 'Password is required for AI detection';
      if (formData.selectedClasses.length === 0) {
        newErrors.selectedClasses = 'Please select at least one incident class';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const payload: UpdateDronePayload = {
      deviceName: formData.deviceName,
      isUsingAiDetection: formData.useAI,
      streamIsOn: formData.streamIsOn,
      streamUrl: formData.streamUrl,
      metadata: {
        alias: formData.alias,
        description: formData.description,
      },
      streamCredentials: formData.useAI ? {
        userName: formData.userName,
        password: formData.password,
        port: formData.port,
      } : undefined,
      cameras: [], // Camera IDs (kept for backward compatibility)
      detectionClasses: formData.useAI ? formData.selectedClasses : [], // YOLO class IDs as numbers
    };

    updateMutation.mutate(payload);
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

  if (!isOpen || !device) return null;

  const personClasses = SURVEILLANCE_CLASSES.filter(c => c.category === 'person');
  const vehicleClasses = SURVEILLANCE_CLASSES.filter(c => c.category === 'vehicle');
  const objectClasses = SURVEILLANCE_CLASSES.filter(c => c.category === 'object');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className="fas fa-edit mr-3 text-blue-500"></i>
              Edit Device
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {device.deviceCategory} - {device.deviceSerialNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Device Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="fas fa-info-circle mr-2 text-blue-500"></i>
              Device Information
            </h3>

            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fas fa-tag mr-2 text-blue-500"></i>
                Device Name
              </label>
              <input
                type="text"
                value={formData.deviceName}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Device description..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Stream URL (for non-drone devices) */}
            {device.deviceCategory !== 'DRONE' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <i className="fas fa-link mr-2 text-blue-500"></i>
                  Stream URL (RTSP/RTMP)
                </label>
                <input
                  type="text"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, streamUrl: e.target.value }))}
                  placeholder="rtsp://username:password@192.168.1.100:554/stream"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Stream Status */}
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-white font-medium">
                    <i className="fas fa-power-off mr-2 text-green-500"></i>
                    Stream Active
                  </span>
                  <p className="text-sm text-gray-400 mt-1">Enable or disable the stream</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.streamIsOn}
                  onChange={(e) => setFormData(prev => ({ ...prev, streamIsOn: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* AI Detection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <i className="fas fa-brain mr-2 text-purple-500"></i>
              AI Detection Settings
            </h3>

            {/* Enable AI */}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, useAI: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Stream Credentials */}
            {formData.useAI && (
              <div className="space-y-4 p-4 bg-purple-900/10 border border-purple-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-purple-400 mb-3">
                  <i className="fas fa-key mr-2"></i>
                  Stream Credentials
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="8554"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Incident Classes */}
            {formData.useAI && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-purple-400">
                    <i className="fas fa-list mr-2"></i>
                    Incident Classes to Track
                  </h4>
                  <span className="text-sm text-gray-400">{formData.selectedClasses.length} selected</span>
                </div>

                {errors.selectedClasses && (
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {errors.selectedClasses}
                  </div>
                )}

                {/* Person Category */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-white flex items-center">
                      <i className="fas fa-user text-red-500 mr-2"></i>
                      Person
                    </h5>
                    <button
                      type="button"
                      onClick={() => selectAllByCategory('person')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {personClasses.map((cls) => (
                      <ClassButton key={cls.id} cls={cls} selected={formData.selectedClasses.includes(cls.id)} onClick={() => toggleClass(cls.id)} />
                    ))}
                  </div>
                </div>

                {/* Vehicle Category */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-white flex items-center">
                      <i className="fas fa-car text-blue-500 mr-2"></i>
                      Vehicles
                    </h5>
                    <button
                      type="button"
                      onClick={() => selectAllByCategory('vehicle')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {vehicleClasses.map((cls) => (
                      <ClassButton key={cls.id} cls={cls} selected={formData.selectedClasses.includes(cls.id)} onClick={() => toggleClass(cls.id)} />
                    ))}
                  </div>
                </div>

                {/* Object Category */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-white flex items-center">
                      <i className="fas fa-box text-yellow-500 mr-2"></i>
                      Objects
                    </h5>
                    <button
                      type="button"
                      onClick={() => selectAllByCategory('object')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {objectClasses.map((cls) => (
                      <ClassButton key={cls.id} cls={cls} selected={formData.selectedClasses.includes(cls.id)} onClick={() => toggleClass(cls.id)} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times mr-2"></i>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Class Selection Button (Compact version for edit modal)
function ClassButton({ cls, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg border transition-all text-xs ${
        selected
          ? 'border-blue-500 bg-blue-500/10 text-white'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-400'
      }`}
    >
      <div className="flex items-center space-x-1">
        <i className={`fas ${cls.icon} ${selected ? 'text-blue-400' : 'text-gray-500'}`}></i>
        <span className="font-medium truncate">{cls.name}</span>
        {selected && <i className="fas fa-check text-blue-500 ml-auto"></i>}
      </div>
    </button>
  );
}
