// hooks/useTelemetry.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface TelemetryData {
  latitude: number;
  longitude: number;
  height: number;
  battery: {
    capacity_percent: number;
  };
  "67-0-0": {
    gimbal_yaw: number;
  };
}

interface DroneUpdate {
  sn: string;
  data: TelemetryData;
  lastUpdate: number;
}

export function useTelemetry(serverUrl = process.env.NEXT_PUBLIC_TELEMETRY_SOCKET_URL || "") {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [droneUpdates, setDroneUpdates] = useState<Map<string, DroneUpdate>>(
    new Map()
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  // Cardinal direction helper
  const getCardinalDirection = (gimbalYaw: number): string => {
    const normalizedAngle = (gimbalYaw + 360) % 360;
    if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return "N";
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return "NE";
    if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return "E";
    if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return "SE";
    if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return "S";
    if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return "SW";
    if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return "W";
    return "NW";
  };

  useEffect(() => {
    // Connect to your Socket.IO server
    const socketConnection = io(serverUrl);
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      console.log("Connected to telemetry server");
      setConnectionStatus("connected");
    });

    socketConnection.on("disconnect", () => {
      console.log("Disconnected from telemetry server");
      setConnectionStatus("disconnected");
    });

    // Listen for drone telemetry updates
    socketConnection.on("droneDataUpdate", (telemetry: any, sn: string) => {
      console.log("📨 Received droneDataUpdate:", { sn, telemetry });

      if (!telemetry?.data || !sn) {
        console.error("❌ Invalid telemetry data received - missing data or sn");
        return;
      }

      const data = telemetry.data;
      console.log(`✅ Telemetry for ${sn}:`, {
        lat: data.latitude,
        lng: data.longitude,
        battery: data.battery?.capacity_percent,
        altitude: data.height
      });

      setDroneUpdates((prev) => {
        const updated = new Map(prev);
        updated.set(sn, {
          sn,
          data,
          lastUpdate: Date.now(),
        });
        console.log(`📊 Total drones tracked: ${updated.size}`);
        return updated;
      });
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [serverUrl]);

  // Get telemetry for specific drone
  const getDroneTelemetry = (sn: string) => {
    return droneUpdates.get(sn);
  };

  // Get processed drone data for UI
  const getProcessedDroneData = (sn: string) => {
    const update = droneUpdates.get(sn);
    if (!update) return null;

    const { data } = update;
    return {
      battery: Math.round(data.battery?.capacity_percent || 0),
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      altitude: data.height || 0,
      direction: getCardinalDirection(data["67-0-0"]?.gimbal_yaw || 0),
      lastUpdate: update.lastUpdate,
      isRecent: Date.now() - update.lastUpdate < 30000, // 30 seconds
    };
  };

  return {
    socket,
    connectionStatus,
    droneUpdates,
    getDroneTelemetry,
    getProcessedDroneData,
    isTelemetrySocketConnected: connectionStatus === "connected",
  };
}
