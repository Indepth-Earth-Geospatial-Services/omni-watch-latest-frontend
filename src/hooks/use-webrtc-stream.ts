"use client";

import { useEffect, useRef, useState } from "react";

export interface UseWebRTCStreamOptions {
  streamUrl: string;
  isOnline: boolean;
  autoPlay?: boolean;
}

export function useWebRTCStream({
  streamUrl,
  isOnline,
  autoPlay = true,
}: UseWebRTCStreamOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing");
  const [displayedMessage, setDisplayedMessage] = useState("");
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Creative loading messages
const LOADING_MESSAGES = [
  "Initializing Optics", "Stabilizing Feed", "Acquiring Target Frame", "Decrypting Stream",
  "Optimizing Transmission", "Aligning Sensors", "Balancing Exposure", "Synchronizing Feed Nodes",
  "Analyzing Motion Vectors", "Recalibrating Optics", "Enhancing Visual Fidelity", "Stabilizing Drone Link",
  "Mapping Surveillance Grid", "Refining Signal Integrity", "Activating Compression Pipeline", "Coalescing Data Frames",
  "Compiling Visual Telemetry", "Decrypting Feed Encryption", "Harmonizing Sensor Arrays", "Integrating AI Subsystems",
  "Locking Geospatial Coordinates", "Refocusing Optics", "Processing Spectral Layers", "Reconfiguring Network Pathways",
  "Stabilizing Uplink", "Reconstructing Visual Stream", "Synchronizing Drone Cluster", "Reinforcing Signal Integrity",
  "Reestablishing Secure Channel", "Filtering Noise Spectrum", "Refining Frame Buffers", "Amplifying Signal Strength",
  "Correlating Data Streams", "Compiling Intelligence Nodes", "Decrypting Visual Patterns", "Reconstructing Imagery",
  "Scanning Heat Signatures", "Assessing Threat Indices", "Rendering Scene Geometry", "Rebuilding Optical Pathways",
  "Synchronizing Latency Buffers", "Revalidating Telemetry", "Analyzing Field Dynamics", "Reinitializing Sensors",
  "Recompiling System Drivers", "Coordinating Feed Arrays", "Stabilizing Focus", "Refining Stream Quality",
  "Updating AI Models", "Extracting Metadata", "Mapping Terrain Contours", "Enhancing Spatial Awareness",
  "Detecting Anomalies", "Reconstructing 3D Frames", "Stabilizing Stream Core", "Amplifying Visual Range",
  "Integrating Data Mesh", "Optimizing Latency", "Refreshing Surveillance Grid", "Decrypting Data Packets",
  "Reconciling Sensor Drift", "Compensating Frame Drop", "Refining Temporal Resolution", "Establishing Secure Sync",
  "Reinforcing Signal Mesh", "Analyzing Object Vectors", "Interpolating Frame Gaps", "Rebuilding Signal Topology",
  "Verifying Source Integrity", "Synchronizing Network Clock", "Enhancing Optical Resolution", "Finalizing Visual Pipeline"
];



  // Type out a message character by character
  const typeMessage = (message: string) => {
    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    let currentIndex = 0;
    setDisplayedMessage("");

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex <= message.length + 3) { // +3 for "..."
        if (currentIndex <= message.length) {
          setDisplayedMessage(message.slice(0, currentIndex));
        } else {
          // Add dots one by one
          const dots = ".".repeat(currentIndex - message.length);
          setDisplayedMessage(message + dots);
        }
        currentIndex++;
      } else {
        // Message fully typed, stop this interval
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, 50); // Type one character every 50ms
  };

  // Start cycling through loading messages
  const startLoadingMessages = () => {
    // Clear any existing intervals
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // Set initial random message and type it
    const randomMsg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    setLoadingMessage(randomMsg);
    typeMessage(randomMsg);

    // Cycle through messages every 3 seconds (giving time for typing effect)
    loadingIntervalRef.current = setInterval(() => {
      const msg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
      setLoadingMessage(msg);
      typeMessage(msg);
    }, 3000);
  };

  // Stop cycling loading messages
  const stopLoadingMessages = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const cleanup = () => {
    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear loading message interval
    stopLoadingMessages();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsConnected(false);
    setIsLoading(false);
  };

  useEffect(() => {
    // Reset reconnect attempts on mount
    reconnectAttemptsRef.current = 0;

    // Don't attempt to connect if stream is offline
    if (!isOnline) {
      cleanup();
      return;
    }

    // Clean up any existing connections before initializing new ones
    cleanup();

    // Initialize WebRTC connection
    const initializeWebRTC = async () => {
      try {
        setIsLoading(true);
        setError(null);
        startLoadingMessages(); // Start cycling through creative messages

        // Create a new RTCPeerConnection
        const configuration: RTCConfiguration = {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        // Handle incoming media tracks
        peerConnection.ontrack = (event) => {
          console.log("Received track:", event.track.kind);
          if (event.streams[0]) {
            mediaStreamRef.current = event.streams[0];
            if (videoRef.current) {
              videoRef.current.srcObject = event.streams[0];
              if (autoPlay) {
                videoRef.current
                  .play()
                  .catch((err) => console.error("Autoplay failed:", err));
              }
            }
          }
        };

        // Reconnection function
        const attemptReconnect = () => {
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.log("Max reconnection attempts reached");
            setError("Unable to reconnect. Stream is offline.");
            setIsLoading(true); // Keep loading state to show texting effect
            // Keep loading messages running even after max attempts
            return;
          }

          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectAttemptsRef.current += 1;
          console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

          // Schedule reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            // Close existing connections
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
              peerConnectionRef.current = null;
            }

            setIsLoading(true);
            setError(null);
            startLoadingMessages(); // Restart messages on reconnect

            // Trigger reconnection
            initializeWebRTC();
          }, RECONNECT_DELAY);
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log("ICE connection state:", peerConnection.iceConnectionState);

          switch (peerConnection.iceConnectionState) {
            case "connected":
            case "completed":
              setIsConnected(true);
              setIsLoading(false);
              setError(null);
              stopLoadingMessages(); // Stop messages on successful connection
              reconnectAttemptsRef.current = 0; // Reset reconnect attempts on success
              break;
            case "failed":
              setIsConnected(false);
              setError("Connection failed");
              setIsLoading(true); // Keep loading state to show texting effect
              // Keep loading messages running
              // Attempt to reconnect
              attemptReconnect();
              break;
            case "disconnected":
              setIsConnected(false);
              setIsLoading(true);
              console.log("Stream disconnected, attempting to reconnect...");
              // Attempt to reconnect after a delay
              attemptReconnect();
              break;
            case "closed":
              setIsConnected(false);
              setIsLoading(false);
              stopLoadingMessages();
              break;
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log("Connection state:", peerConnection.connectionState);
        };

        // WebSocket signaling for WebRTC
        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          console.log("WebSocket connected to:", streamUrl);

          // Add transceiver to receive video
          peerConnection.addTransceiver("video", { direction: "recvonly" });
          peerConnection.addTransceiver("audio", { direction: "recvonly" });

          // Create offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          // Send offer to server
          ws.send(
            JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
            })
          );
        };

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("WebSocket message received:", message.type);

            if (message.type === "answer" && message.sdp) {
              // Set remote description from answer
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription({
                  type: "answer",
                  sdp: message.sdp,
                })
              );
            } else if (message.type === "ice" && message.candidate) {
              // Add ICE candidate
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(message.candidate)
              );
            }
          } catch (err) {
            console.error("Error handling WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("WebSocket connection failed");
          setIsLoading(true); // Keep loading state to show texting effect
          // Keep loading messages running
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
        };

        // Send ICE candidates to server
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "ice",
                candidate: event.candidate,
              })
            );
          }
        };

        console.log("WebRTC initialization complete for:", streamUrl);

      } catch (err) {
        console.error("WebRTC initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to connect");
        setIsLoading(true); // Keep loading state to show texting effect
        // Keep loading messages running
      }
    };

    initializeWebRTC();

    // Cleanup function
    return () => {
      cleanup();
    };
  }, [streamUrl, isOnline]);

  const retry = () => {
    reconnectAttemptsRef.current = 0; // Reset reconnect attempts
    cleanup();
    setError(null);
    setIsLoading(true); // This will trigger a reconnection
  };

  return {
    videoRef,
    isConnected,
    isLoading,
    loadingMessage: displayedMessage, // Return the typed message instead
    error,
    retry,
    mediaStream: mediaStreamRef.current,
  };
}
