# ISR Command & Control System

## Overview

The ISR (Intelligence, Surveillance, and Reconnaissance) Command & Control System is a comprehensive web-based platform for real-time drone surveillance, telemetry monitoring, and threat detection. The system provides a centralized operations center for managing multiple drone feeds, analyzing telemetry data, and coordinating surveillance activities through an intuitive dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The system uses a multi-page application (MPA) architecture with separate HTML pages for different modules including dashboard, geospatial intelligence, AI detection, analytics, incident management, logs, reports, and user management. The UI is built with TailwindCSS for responsive design and uses a dark theme optimized for command center operations. Real-time updates are handled through Socket.IO connections, providing live telemetry data and stream status updates.

### Backend Architecture
The backend is built on Node.js with Express.js serving static files and handling API endpoints. Socket.IO provides WebSocket connections for real-time communication between clients and server. The system processes RTSP video streams through FFmpeg, extracting coordinate data using Tesseract.js OCR, and distributes this information to connected clients via WebSocket events.

### Video Streaming Solution
The system implements a dual-stream architecture using both direct RTSP processing and Agora Media Gateway integration. RTSP streams from drone hardware are processed through FFmpeg for coordinate extraction, while Agora's RTC protocol handles ultra-low latency video distribution to client browsers. This approach separates data extraction from video delivery for optimal performance.

### Real-time Data Processing
MQTT protocol handles drone telemetry data collection from hardware sensors. The system processes this data alongside OCR-extracted coordinates from video streams to provide comprehensive situational awareness. Socket.IO distributes processed data to all connected clients in real-time.

### Geospatial Integration
The mapping functionality uses MapLibre GL JS with multiple basemap providers including dark theme, satellite imagery, and positron styles. Drone positions are displayed as animated markers with real-time coordinate updates from OCR processing and MQTT telemetry.

## External Dependencies

### Video Processing
- **FFmpeg**: Video stream processing and frame extraction for OCR analysis
- **Tesseract.js**: Optical Character Recognition for extracting coordinates from video overlays

### Real-time Communication
- **Socket.IO**: WebSocket communication for real-time data distribution
- **MQTT**: Message queuing protocol for drone telemetry data collection

### Video Streaming
- **Agora Media Gateway**: Ultra-low latency video streaming service for live drone feeds
- **RTSP Protocol**: Direct video stream ingestion from drone hardware

### Frontend Libraries
- **TailwindCSS**: Utility-first CSS framework for responsive UI design
- **MapLibre GL JS**: Interactive mapping library for geospatial visualization
- **Chart.js**: Data visualization for analytics dashboard
- **Font Awesome**: Icon library for UI elements
