# WebRTC Live Feed Setup Guide

This guide explains how to configure and use the WebRTC-based live feed system for the surveillance application.

## Overview

The live feed page has been converted to use WebRTC for streaming video instead of Agora SDK. This allows for more flexible streaming options and better control over your video sources.

## Configuration

### 1. Stream Configuration File

All stream configurations are managed in: `src/config/webrtc-streams.ts`

This file contains an array of `WebRTCStream` objects that define your video streams.

### 2. Stream Object Structure

```typescript
{
  id: string;              // Unique identifier for the stream
  name: string;            // Display name for the stream
  streamUrl: string;       // WebRTC stream URL (e.g., wss://your-server.com/stream1)
  isOnline: boolean;       // Whether the stream is currently online
  feedType: "DRONE" | "CCTV" | "BODY CAM";  // Type of feed
  metadata?: {             // Optional metadata
    location?: string;     // Physical location
    description?: string;  // Description of the stream
    [key: string]: any;   // Any other custom fields
  };
}
```

### 3. Example Configuration

```typescript
export const webrtcStreams: WebRTCStream[] = [
  {
    id: "stream-001",
    name: "Drone Feed 1",
    streamUrl: "wss://your-webrtc-server.com/stream1",
    isOnline: true,
    feedType: "DRONE",
    metadata: {
      location: "Lagos Pipeline Corridor",
      description: "Main surveillance drone",
    },
  },
  {
    id: "stream-002",
    name: "CCTV Feed 1",
    streamUrl: "wss://your-webrtc-server.com/stream2",
    isOnline: false,
    feedType: "CCTV",
    metadata: {
      location: "Kurmi Market, Kano",
      description: "Market entrance camera",
    },
  },
];
```

## How It Works

### Stream Status

- **Online Streams** (`isOnline: true`): Will attempt to connect and display video
- **Offline Streams** (`isOnline: false`): Will show an offline status indicator

The system automatically handles:
- Showing a "Connecting..." state while establishing connection
- Displaying "Stream Offline" for offline streams
- Showing "Connection Error" if something goes wrong
- Displaying the live video feed once connected

### Features

1. **Automatic Status Display**
   - Online streams show a green "LIVE" badge with a pulsing indicator
   - Offline streams show a red "OFFLINE" badge

2. **Search & Filter**
   - Search by stream name, ID, location, or description
   - Filter by feed type (ALL, DRONE, CCTV, BODY CAM)

3. **Stream Statistics**
   - Shows active/total stream count in the header

4. **Full-Screen View**
   - Click any stream card to view it in full-screen mode
   - Full-screen view includes stream metadata and controls

## WebRTC Implementation

### Current Implementation

The WebRTC hook (`src/hooks/use-webrtc-stream.ts`) provides a basic WebRTC setup with:
- RTCPeerConnection initialization
- STUN server configuration
- Connection state management
- Error handling

### What You Need to Implement

The current implementation is a **skeleton** that needs to be connected to your actual WebRTC signaling server. You'll need to:

1. **Set up a WebRTC Signaling Server**
   - This handles the WebRTC offer/answer exchange
   - Common options: Socket.IO, WebSocket, or a dedicated service like Janus or Kurento

2. **Implement Signaling Logic**

   In `src/hooks/use-webrtc-stream.ts`, replace the TODO section with your signaling code:

   ```typescript
   // Example signaling flow (you need to implement this):
   const signalingSocket = new WebSocket(streamUrl);

   signalingSocket.onopen = async () => {
     // Create and send offer
     const offer = await peerConnection.createOffer();
     await peerConnection.setLocalDescription(offer);
     signalingSocket.send(JSON.stringify({ type: 'offer', offer }));
   };

   signalingSocket.onmessage = async (event) => {
     const data = JSON.parse(event.data);

     if (data.type === 'answer') {
       await peerConnection.setRemoteDescription(data.answer);
     } else if (data.type === 'ice-candidate') {
       await peerConnection.addIceCandidate(data.candidate);
     }
   };

   peerConnection.onicecandidate = (event) => {
     if (event.candidate) {
       signalingSocket.send(JSON.stringify({
         type: 'ice-candidate',
         candidate: event.candidate
       }));
     }
   };
   ```

3. **Configure Your Stream URLs**
   - Update `streamUrl` in the config file to point to your WebRTC streams
   - Format depends on your signaling server (e.g., `wss://`, `ws://`, etc.)

## Usage

1. **Configure Your Streams**
   - Edit `src/config/webrtc-streams.ts`
   - Add your stream URLs
   - Set `isOnline` to `true` for active streams

2. **Navigate to Live Feed Page**
   - Go to `/live-feed` in your application
   - You'll see all configured streams in a grid layout

3. **Manage Streams**
   - To add a new stream: Add a new object to the `webrtcStreams` array
   - To remove a stream: Delete the object from the array
   - To toggle status: Change the `isOnline` value

## Stream Server Options

Here are some popular WebRTC media server options:

1. **Janus Gateway** - Lightweight, open-source
2. **Kurento** - Full-featured media server
3. **Mediasoup** - Node.js-based SFU
4. **OvenMediaEngine** - Live streaming server
5. **Custom WebSocket Server** - For simple peer-to-peer

## Troubleshooting

### Streams Not Connecting

1. Check your `streamUrl` is correct
2. Ensure `isOnline` is set to `true`
3. Verify your WebRTC server is running
4. Check browser console for WebRTC errors

### Video Not Displaying

1. Check browser console for media errors
2. Ensure you have the correct STUN/TURN servers configured
3. Verify the stream source is sending video tracks

### Connection Errors

1. Check firewall settings (WebRTC uses UDP)
2. Verify STUN/TURN server accessibility
3. Check signaling server is reachable

## Development Tips

- Test with `isOnline: false` first to verify UI
- Use browser DevTools to inspect WebRTC connections
- Add console logs in the hook to debug connection flow
- Start with one stream, then scale up

## Next Steps

1. Set up your WebRTC signaling server
2. Implement signaling logic in `use-webrtc-stream.ts`
3. Update stream URLs in `webrtc-streams.ts`
4. Test with real video streams
5. Adjust STUN/TURN servers as needed

## Example with Real Stream

Once you have a WebRTC server running:

```typescript
{
  id: "prod-drone-001",
  name: "Main Surveillance Drone",
  streamUrl: "wss://your-actual-server.com:8188/stream/drone-001",
  isOnline: true,  // Set to true when ready
  feedType: "DRONE",
  metadata: {
    location: "North Pipeline Sector A",
    description: "24/7 pipeline monitoring",
    latitude: 6.5244,
    longitude: 3.3792,
  },
}
```

## Support

For questions or issues:
- Check the browser console for errors
- Review the WebRTC hook implementation
- Verify your signaling server is working correctly
