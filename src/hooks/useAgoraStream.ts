"use client";
import AgoraRTC, { IAgoraRTCClient, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { useEffect, useState, useRef, useMemo } from "react";

interface AgoraStreamConfig {
  appId: string;
  token: string;
  channel: string;
  sn: string | number;
}

// Client cache to reuse connections
const clientCache = new Map<string, IAgoraRTCClient>();

export function useAgoraStream(config: AgoraStreamConfig | null) {
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<IRemoteVideoTrack | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid stale closures
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const configRef = useRef<AgoraStreamConfig | null>(null);

  // Create stable config key for comparison
  const configKey = useMemo(() => {
    if (!config) return null;
    return `${config.appId}_${config.channel}_${config.sn}`;
  }, [config?.appId, config?.channel, config?.sn]);

  // Memoize the config to prevent unnecessary re-renders
  const stableConfig = useMemo(() => config, [configKey, config?.token]);

  useEffect(() => {
    // Early bailout if no config
    if (!stableConfig || !stableConfig.appId || !stableConfig.channel) {
      if (stableConfig) {
        setError("Missing required configuration");
      }
      return;
    }

    // Skip if already initializing or config hasn't actually changed
    if (isInitializingRef.current) {
      return;
    }

    // Check if we're reconnecting to the same channel
    const isSameConfig =
      configRef.current?.appId === stableConfig.appId &&
      configRef.current?.channel === stableConfig.channel &&
      configRef.current?.sn === stableConfig.sn;

    if (isSameConfig && isConnected && clientRef.current) {
      // Same config and already connected, skip initialization
      return;
    }

    configRef.current = stableConfig;

    // Check cache for existing client
    const cacheKey = `${stableConfig.appId}_${stableConfig.channel}`;
    const cachedClient = clientCache.get(cacheKey);

    let agoraClient: IAgoraRTCClient | null = null;
    let isCancelled = false;

    const initializeStream = async () => {
      try {
        isInitializingRef.current = true;
        setError(null);

        // Reuse cached client if available
        if (cachedClient && cachedClient.connectionState === "CONNECTED") {
          console.log(
            "♻️ Reusing existing Agora client for channel:",
            stableConfig.channel
          );
          agoraClient = cachedClient;
          clientRef.current = agoraClient;
          setIsConnected(true);

          // Check for existing video tracks
          const users = agoraClient.remoteUsers;
          for (const user of users) {
            if (user.videoTrack) {
              setRemoteVideoTrack(user.videoTrack);
              break;
            }
          }
          return;
        }

        // Create new client
        agoraClient = AgoraRTC.createClient({
          mode: "live",
          codec: "h264",
        });

        // Store in cache
        clientCache.set(cacheKey, agoraClient);
        clientRef.current = agoraClient;

        // Set up event listeners with cleanup tracking
        const handleUserPublished = async (user: any, mediaType: string) => {
          if (isCancelled) return;

          console.log("User published:", user.uid, mediaType);

          try {
            await agoraClient!.subscribe(user, mediaType);

            if (mediaType === "video" && !isCancelled) {
              console.log("Video track received");
              setRemoteVideoTrack(user.videoTrack || null);
            }

            if (mediaType === "audio" && user.audioTrack) {
              user.audioTrack.play();
            }
          } catch (err) {
            console.error("Failed to subscribe:", err);
          }
        };

        const handleUserUnpublished = (user: any, mediaType: string) => {
          if (isCancelled) return;

          console.log("User unpublished:", user.uid, mediaType);

          if (mediaType === "video") {
            setRemoteVideoTrack(null);
          }
        };

        const handleConnectionStateChange = (
          curState: string,
          prevState: string
        ) => {
          if (isCancelled) return;

          console.log("Connection state changed:", prevState, "->", curState);

          // Update connection status
          setIsConnected(curState === "CONNECTED");

          // Handle disconnection
          if (curState === "DISCONNECTED" || curState === "DISCONNECTING") {
            setRemoteVideoTrack(null);
            // Remove from cache if disconnected
            clientCache.delete(cacheKey);
          }
        };

        agoraClient.on("user-published", handleUserPublished);
        agoraClient.on("user-unpublished", handleUserUnpublished);
        agoraClient.on("connection-state-change", handleConnectionStateChange);

        // Set role as audience
        await agoraClient.setClientRole("audience");

        // Join channel with timeout
        const joinTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Join timeout")), 10000)
        );

        const uid = await Promise.race([
          agoraClient.join(
            stableConfig.appId,
            stableConfig.channel,
            stableConfig.token || null,
            stableConfig.sn
          ),
          joinTimeout,
        ]);

        if (isCancelled) {
          await agoraClient.leave();
          return;
        }

        console.log(
          `✅ Joined Agora channel: ${stableConfig.channel} with UID: ${uid}`
        );
        setIsConnected(true);
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to initialize Agora stream:", error);
          setError(error instanceof Error ? error.message : "Unknown error");
          setIsConnected(false);

          // Remove from cache on error
          clientCache.delete(cacheKey);
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeStream();

    // Cleanup
    return () => {
      isCancelled = true;
      isInitializingRef.current = false;

      // Debounced cleanup - only disconnect if we're not reconnecting
      const cleanup = async () => {
        // Check if we should keep the connection alive
        if (configRef.current?.channel === stableConfig.channel) {
          // Same channel, might be a quick re-render
          return;
        }

        if (clientRef.current) {
          console.log("🔌 Leaving Agora channel:", stableConfig.channel);
          try {
            // Remove event listeners
            clientRef.current.removeAllListeners();

            // Leave channel
            await clientRef.current.leave();

            // Remove from cache
            clientCache.delete(cacheKey);
          } catch (err) {
            console.error("Error during cleanup:", err);
          }

          clientRef.current = null;
          setIsConnected(false);
          setRemoteVideoTrack(null);
        }
      };

      // Delay cleanup slightly to handle quick re-renders
      const timeoutId = setTimeout(cleanup, 100);

      return () => clearTimeout(timeoutId);
    };
  }, [stableConfig, configKey]);

  // Expose method to manually refresh connection
  const refresh = () => {
    if (clientRef.current && stableConfig) {
      const cacheKey = `${stableConfig.appId}_${stableConfig.channel}`;
      clientCache.delete(cacheKey);
      clientRef.current = null;
      setIsConnected(false);
      // Will trigger re-initialization via useEffect
    }
  };

  return {
    agoraClient: clientRef.current,
    videoTrack: remoteVideoTrack,
    isConnected,
    error,
    refresh,
  };
}

// Utility to clear all cached connections (useful for cleanup)
export function clearAgoraCache() {
  clientCache.forEach((client) => {
    try {
      client.leave();
    } catch (err) {
      console.error("Error clearing client:", err);
    }
  });
  clientCache.clear();
}
