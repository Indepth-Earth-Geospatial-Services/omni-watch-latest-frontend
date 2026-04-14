// Hook to fetch unregistered devices from telemetry socket
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAllDrones } from '@/services/api/drone-api';

export interface UnregisteredDevice {
  serialNumber: string;
  deviceName: string;
  lastSeen: Date;
  telemetryData?: any;
}

const TELEMETRY_SOCKET_URL = process.env.NEXT_PUBLIC_TELEMETRY_SOCKET_URL || "";
console.log('Connecting to telemetry server:', TELEMETRY_SOCKET_URL);

export function useUnregisteredDevices() {
  const [unregisteredDevices, setUnregisteredDevices] = useState<UnregisteredDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to telemetry socket
    const socketInstance = io(TELEMETRY_SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to telemetry socket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from telemetry socket');
      setIsConnected(false);
    });

    // Listen for drone data updates
    // Server emits: io.emit('droneDataUpdate', droneData, sn);
    // So we receive TWO parameters: (droneData, sn)
    socketInstance.on('droneDataUpdate', async (droneData: any, sn: string) => {
      try {
        // console.log('Received droneDataUpdate:', { sn, droneData });

        // Fetch registered drones from database
        const registeredDrones = await getAllDrones();
        const registeredSerials = new Set(registeredDrones.map(d => d.deviceSerialNumber));

        // Use the serial number parameter directly
        const serialNumber = sn;

        if (serialNumber && !registeredSerials.has(serialNumber)) {
          // This device is not registered
          // console.log('Unregistered device detected:', serialNumber);

          setUnregisteredDevices((prev) => {
            const existingIndex = prev.findIndex(d => d.serialNumber === serialNumber);
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
              // Add new device
              console.log('Added new unregistered device:', serialNumber);
              return [...prev, newDevice];
            }
          });
        } else {
          console.log('Device already registered:', serialNumber);
        }
      } catch (error) {
        console.error('Error processing telemetry:', error);
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
      setUnregisteredDevices((prev) =>
        prev.filter((device) => device.lastSeen > fiveMinutesAgo)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    unregisteredDevices,
    isConnected,
    socket,
  };
}
