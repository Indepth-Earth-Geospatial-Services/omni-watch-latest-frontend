// Edit Device Modal - Edit existing device configuration
"use client";

import React, { useState, useEffect } from 'react';
import { DroneAPIResponse } from '@/hooks/useDronesWebSocket';

interface UpdateDronePayload {
  deviceName: string;
  streamIsOn: boolean;
  streamUrl: string;
  metadata: { alias: string; description: string };
  cameras: string[];
}

// Stub — EditDeviceModal is never shown when USE_DJI_CLOUD=true.
async function updateDrone(_sn: string, _payload: UpdateDronePayload): Promise<void> {}
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DroneAPIResponse | null;
}

export function EditDeviceModal({ isOpen, onClose, device }: EditDeviceModalProps) {
  const queryClient = useQueryClient();

  if (!isOpen || !device) return null;

  // Form state
  const [formData, setFormData] = useState({
    deviceName: '',
    alias: '',
    description: '',
    streamUrl: '',
    streamIsOn: false,
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
        streamIsOn: device.streamIsOn,
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



    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const payload: UpdateDronePayload = {
      deviceName: formData.deviceName,
      streamIsOn: formData.streamIsOn,
      streamUrl: formData.streamUrl,
      metadata: {
        alias: formData.alias,
        description: formData.description,
      },
      cameras: [], // Camera IDs (kept for backward compatibility)
    };

    updateMutation.mutate(payload);
  };



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


