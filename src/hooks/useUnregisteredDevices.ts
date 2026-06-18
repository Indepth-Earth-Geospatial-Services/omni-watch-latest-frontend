// Hook to detect devices seen via telemetry socket that are not in the DJI workspace.
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getDJIDevices } from '@/services/djiservice-layer/dji-service';
import { DJI_CONFIG } from '@/lib/config/config';
import { getToken } from '@/lib/config/token-store';

export interface UnregisteredDevice {
  serialNumber: string;
  deviceName: string;
  lastSeen: Date;
  telemetryData?: any;
}

const TELEMETRY_SOCKET_URL = process.env.NEXT_PUBLIC_TELEMETRY_SOCKET_URL || DJI_CONFIG.BASE_URL;

export function useUnregisteredDevices() {
  const [unregisteredDevices, setUnregisteredDevices] = useState<UnregisteredDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(TELEMETRY_SOCKET_URL, {
      path: '/ws/events',
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for drone data updates
    // Server emits: io.emit('droneDataUpdate', droneData, sn);
    // So we receive TWO parameters: (droneData, sn)
    socketInstance.on('droneDataUpdate', async (droneData: any, sn: string) => {
      try {
        const workspaceId = DJI_CONFIG.WORKSPACE_ID;
        const workspaceDevices = await getDJIDevices(workspaceId);
        const registeredSerials = new Set(workspaceDevices.map((d) => d.deviceSn));

        // Use the serial number parameter directly
        const serialNumber = sn;

        if (serialNumber && !registeredSerials.has(serialNumber)) {
          // This device is not registered
          // console.log('Unregistered device detected:', serialNumber);

          setUnregisteredDevices((prev) => {
            const existingIndex = prev.findIndex((d) => d.serialNumber === serialNumber);
            const newDevice: UnregisteredDevice = {
              serialNumber,
              deviceName: droneData?.deviceName || `Drone ${serialNumber.substring(0, 8)}`,
              lastSeen: new Date(),
              telemetryData: droneData,
            };

            if (existingIndex >= 0) {
              // Update existing device
              const updated = [...prev];
              updated[existingIndex] = newDevice;
              // console.log('Updated unregistered device:', serialNumber);
              return updated;
            } else {
              return [...prev, newDevice];
            }
          });
        }
      } catch {
        // ignore telemetry processing errors
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Remove devices that haven't been seen in 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setUnregisteredDevices((prev) => prev.filter((device) => device.lastSeen > fiveMinutesAgo));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    unregisteredDevices,
    isConnected,
    socket,
  };
}
