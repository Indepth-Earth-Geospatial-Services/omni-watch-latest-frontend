import asyncio
import json
import cv2
import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame
from ultralytics import YOLO
import torch
import supervision as sv
from collections import defaultdict
import aiohttp
from datetime import datetime
import base64


# Security/surveillance related COCO classes
SECURITY_CLASSES = {
    0: 'person',
    1: 'bicycle',
    2: 'car',
    3: 'motorcycle',
    5: 'bus',
    7: 'truck',
    24: 'backpack',
    26: 'handbag',
    28: 'suitcase',
    43: 'knife',
    63: 'laptop',
    67: 'cell phone'
}


# Initialize YOLO model
print("Loading YOLOv8n (nano) model for fast inference...")
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Using device: {device}")


# Load the model - using YOLOv8n (nano) for speed
# Options: yolov8n.pt (fastest), yolov8s.pt (small), yolov8m.pt (medium), yolov8l.pt (large), yolov8x.pt (extra large)
model = YOLO('yolov8x6.pt')  # Changed from yolov8x6 to yolov8n for 10-20x faster inference
model.to(device)
print("Model loaded successfully!")


# Set to keep track of active PeerConnections
pcs = set()


# WebSocket connections for streaming processed video
websocket_connections = set()


# Global to share the processed video track between connections
processed_video_track = None


# Server configuration for sending detection data
SERVER_URL = "http://localhost:4000/detection"  # Your Node.js server endpoint


class YOLOVideoTransform(VideoStreamTrack):
    """
    A video track that transforms frames from another track using YOLO detection
    """
    kind = "video"


    def __init__(self, track, process_every_n_frames=15):  # Increased from 9 to 15 for less lag
        super().__init__()
        self.track = track
        self.frame_count = 0
        self.process_every_n_frames = process_every_n_frames
        self.last_detections = []  # Cache last detection results


        # Initialize ByteTrack tracker with optimized settings
        self.tracker = sv.ByteTrack(
            track_activation_threshold=0.3,  # Higher threshold for better performance
            lost_track_buffer=30,            # Shorter buffer
            minimum_matching_threshold=0.8,  # Higher match threshold
            frame_rate=30                    # Assume 30 fps
        )


        # Track previously seen object IDs
        self.seen_track_ids = set()


        # Track object counts
        self.object_counts = defaultdict(int)


        # Color mapping for each object class
        self.class_colors = {
            'person': (0, 255, 0),        # Green
            'bicycle': (255, 0, 0),       # Blue
            'car': (0, 165, 255),         # Orange
            'motorcycle': (255, 0, 255),  # Magenta
            'bus': (255, 255, 0),         # Cyan
            'truck': (0, 128, 255),       # Dark Orange
            'backpack': (128, 0, 128),    # Purple
            'handbag': (255, 192, 203),   # Pink
            'suitcase': (165, 42, 42),    # Brown
            'knife': (0, 0, 255),         # Red
            'laptop': (255, 255, 255),    # White
            'cell phone': (128, 128, 128) # Gray
        }


    def _get_color_for_class(self, label):
        """Get consistent color for an object class"""
        return self.class_colors.get(label, (0, 255, 0))  # Default to green if not found


    async def send_detection_to_server(self, object_type, confidence, track_id):
        """Send detection data to Node.js server"""
        try:
            payload = {
                "object_type": object_type,
                "confidence": float(confidence),
                "track_id": int(track_id),
                "timestamp": datetime.now().isoformat()
            }


            async with aiohttp.ClientSession() as session:
                async with session.post(SERVER_URL, json=payload, timeout=aiohttp.ClientTimeout(total=2)) as response:
                    if response.status == 200:
                        print(f"✅ Sent detection: {object_type} (ID: {track_id}, Conf: {confidence:.2f})")
                    else:
                        print(f"⚠️ Server responded with status {response.status}")
        except asyncio.TimeoutError:
            print(f"⚠️ Timeout sending detection to server")
        except Exception as e:
            print(f"⚠️ Error sending detection: {e}")


    async def recv(self):
        frame = await self.track.recv()


        # Convert frame to numpy array
        img = frame.to_ndarray(format="bgr24")


        # Debug: Log first frame received
        if not hasattr(self, '_first_recv'):
            print(f"📹 First frame received! Shape: {img.shape}")
            self._first_recv = True


        # Only run YOLO inference every N frames
        if self.frame_count % self.process_every_n_frames == 0:
            # Run YOLO inference with reduced input size for speed
            # imgsz=320 is much faster than default 640, with slight accuracy trade-off
            results = model(img, conf=0.25, device=device, verbose=False, imgsz=448, half=True if device == 'cuda' else False)


            # Convert YOLO results to supervision Detections format
            detections = sv.Detections.from_ultralytics(results[0])


            # Filter only security classes
            filtered_indices = [i for i, cls_id in enumerate(detections.class_id) if cls_id in SECURITY_CLASSES]
            if filtered_indices:
                detections = detections[filtered_indices]


                # Update tracker with detections
                detections = self.tracker.update_with_detections(detections)


                # Store detections for reuse and count objects
                self.last_detections = []
                self.object_counts = defaultdict(int)


                # Check if tracker_id exists
                if detections.tracker_id is not None:
                    for i, (bbox, track_id, cls_id, confidence) in enumerate(zip(
                        detections.xyxy,
                        detections.tracker_id,
                        detections.class_id,
                        detections.confidence
                    )):
                        x1, y1, x2, y2 = map(int, bbox)
                        label = SECURITY_CLASSES[cls_id]
                        self.last_detections.append((x1, y1, x2, y2, label, confidence, int(track_id)))


                        # Count objects by class
                        self.object_counts[label] += 1


                        # Check if this is a new object (new track ID)
                        if track_id not in self.seen_track_ids:
                            self.seen_track_ids.add(track_id)
                            # Send detection to server in background
                            asyncio.create_task(self.send_detection_to_server(label, confidence, track_id))
            else:
                self.last_detections = []
                self.object_counts = defaultdict(int)
        else:
            # Recalculate object counts from cached detections
            self.object_counts = defaultdict(int)
            for x1, y1, x2, y2, label, confidence, track_id in self.last_detections:
                self.object_counts[label] += 1


        # Draw detections (from current or cached results) - optimized drawing with class colors
        for x1, y1, x2, y2, label, confidence, track_id in self.last_detections:
            # Get color based on object class (all persons same color, all cars same color, etc.)
            color = self._get_color_for_class(label)


            # Draw bounding box with class-specific color
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)


            # Draw label with confidence and track ID with background
            text = f"{label} ID:{track_id}"
            (text_width, text_height), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)


            # Draw background rectangle for text
            cv2.rectangle(img, (x1, y1 - text_height - 8), (x1 + text_width + 4, y1), color, -1)


            # Draw text in black for contrast
            cv2.putText(img, text, (x1 + 2, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)


        # Display object counts instead of frame counter - only when detections exist
        if self.object_counts:
            y_position = 30
            for obj_type, count in sorted(self.object_counts.items()):
                count_text = f"{obj_type}: {count}"
                cv2.putText(img, count_text, (10, y_position), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                y_position += 30


        self.frame_count += 1


        # Broadcast frame to WebSocket clients
        await self.broadcast_frame(img)


        # Convert back to VideoFrame
        new_frame = VideoFrame.from_ndarray(img, format="bgr24")
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base


        return new_frame


    async def broadcast_frame(self, img):
        """Broadcast processed frame to all connected WebSocket clients"""
        if websocket_connections:
            try:
                # Encode frame as JPEG
                success, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 80])


                if not success:
                    print("❌ Failed to encode frame")
                    return


                # Convert buffer to bytes and base64 encode
                jpg_as_text = base64.b64encode(buffer.tobytes()).decode('utf-8')


                # Create message
                message = json.dumps({
                    'type': 'frame',
                    'data': jpg_as_text,
                    'timestamp': datetime.now().isoformat()
                })


                # Send to all connected clients
                disconnected = set()
                for ws in websocket_connections:
                    try:
                        await ws.send_str(message)
                        # Log first frame sent
                        if not hasattr(self, '_first_frame_sent'):
                            print(f"✅ First frame sent to WebSocket client (size: {len(jpg_as_text)} bytes)")
                            self._first_frame_sent = True
                    except Exception as e:
                        print(f"❌ Error sending to WebSocket client: {e}")
                        disconnected.add(ws)


                # Remove disconnected clients
                websocket_connections.difference_update(disconnected)
            except Exception as e:
                print(f"❌ Error in broadcast_frame: {e}")


async def process_frames(video_track):
    """Continuously process frames from the video track"""
    print("🎬 Starting frame processing loop...")
    try:
        while True:
            try:
                await video_track.recv()
            except Exception as e:
                print(f"Error processing frame: {e}")
                break
    except Exception as e:
        print(f"Frame processing loop ended: {e}")


async def consume_offer(request):
    """Handle offer from browser - receives video stream"""
    global processed_video_track


    params = await request.json()
    print("📥 Received consume offer from browser")


    pc = RTCPeerConnection()
    pcs.add(pc)


    @pc.on("track")
    async def on_track(track):
        global processed_video_track
        print(f"Track received: {track.kind}")


        if track.kind == "video":
            # Create YOLO transform track
            processed_video_track = YOLOVideoTransform(track)
            print("✅ YOLO processing pipeline created!")


            # Start processing frames
            asyncio.create_task(process_frames(processed_video_track))


        @track.on("ended")
        async def on_ended():
            print(f"Track ended: {track.kind}")


    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        print(f"[CONSUME] ICE connection state: {pc.iceConnectionState}")


    # Apply remote offer
    offer_desc = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    await pc.setRemoteDescription(offer_desc)


    # Create and send answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)


    response = web.json_response({
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    })
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


async def websocket_handler(request):
    """Handle WebSocket connections for streaming processed video"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)


    # Add to active connections
    websocket_connections.add(ws)
    print(f"🔌 WebSocket client connected. Total clients: {len(websocket_connections)}")


    # Send a test frame to verify connection
    try:
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(test_frame, "Waiting for video stream...", (50, 240),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        _, buffer = cv2.imencode('.jpg', test_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        jpg_as_text = base64.b64encode(buffer.tobytes()).decode('utf-8')
        test_message = json.dumps({
            'type': 'frame',
            'data': jpg_as_text,
            'timestamp': datetime.now().isoformat()
        })
        await ws.send_str(test_message)
        print("📤 Sent test frame to WebSocket client")
    except Exception as e:
        print(f"Error sending test frame: {e}")


    try:
        # Keep connection alive and handle incoming messages
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                # Handle any client messages if needed
                pass
            elif msg.type == web.WSMsgType.ERROR:
                print(f'WebSocket connection closed with exception {ws.exception()}')
    finally:
        # Remove from active connections
        websocket_connections.discard(ws)
        print(f"🔌 WebSocket client disconnected. Total clients: {len(websocket_connections)}")


    return ws


async def on_shutdown(app):
    print("Server shutdown initiated. Closing all connections...")


    # Close all WebSocket connections
    ws_close_tasks = [ws.close() for ws in websocket_connections.copy()]
    if ws_close_tasks:
        await asyncio.gather(*ws_close_tasks, return_exceptions=True)
    print("All WebSocket connections closed.")


    # Close all PeerConnections
    coros = [pc.close() for pc in pcs.copy()]
    if coros:
        await asyncio.gather(*coros, return_exceptions=True)
    print("All PeerConnections closed.")


    print("Cleanup complete. Exiting.")


app = web.Application()
app.router.add_post("/consume", consume_offer)
app.router.add_get("/ws", websocket_handler)


# CORS preflight handler
async def options_handler(request):
    return web.Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )


app.router.add_options("/consume", options_handler)
app.on_shutdown.append(on_shutdown)


if __name__ == "__main__":
    print("\n" + "="*50)
    print("YOLO Security Surveillance Server")
    print("="*50)
    print(f"Model: YOLOv8n (optimized for speed)")
    print(f"Device: {device}")
    print(f"Frame processing: Every 15th frame @ 416px")
    print(f"WebSocket endpoint: ws://localhost:6060/ws")
    print(f"Monitoring classes: {', '.join(SECURITY_CLASSES.values())}")
    print("="*50 + "\n")
    web.run_app(app, port=6060)
