# Product Requirements Document (PRD)

## ISR Command & Control System

**Version:** 1.0  
**Date:** September 25, 2025  
**Product Manager:** [To be assigned]  
**Engineering Lead:** [To be assigned]

---

## Executive Summary

The ISR (Intelligence, Surveillance, and Reconnaissance) Command & Control System is a web-based platform designed to provide real-time situational awareness and operational control for drone-based surveillance operations. This system serves as a centralized command center for managing multiple drone assets, processing live telemetry data, and coordinating surveillance activities.

**Current Status:** MVP with core video streaming and geospatial features implemented. Additional modules require full backend integration.

---

## Problem Statement

The surveillance team currently faces critical operational challenges:

- **Unreliable Drone Streaming**: Using HDMI cords to connect AUTEL drone controllers to laptops, then streaming through Google Meet creates lag, connection failures, and hardware dependency issues
- **Manual Incident Detection**: Operators must actively monitor live feeds to identify threats and incidents, leading to fatigue and missed detections
- **Time-Consuming Report Generation**: Writing incident reports manually after operations is extremely tiresome and inefficient with multiple incidents
- **Fragmented Workflow**: No integration between live feeds, incident detection, and report generation processes

---

## Product Goals

### Primary Goals

1. **Centralized Drone Feeds**: Replace HDMI cord setup with lag-free, multi-access drone streaming platform
2. **Automated Incident Detection**: Integrate existing Python AI model to automatically identify incidents from live feeds
3. **Automated Report Generation**: Generate PowerPoint/PDF reports from AI detections using existing report templates
4. **Architecture Modernization**: Separate NextJS frontend from standalone backend with API endpoints
5. **Multi-User Access**: Enable multiple team members to view same drone feeds simultaneously

### Success Metrics

- **Response Time**: < 2 seconds for threat detection alerts
- **System Uptime**: 99.9% availability for critical operations
- **User Capacity**: Support 50+ simultaneous operators
- **Coverage Area**: Coordinate surveillance across 100+ square kilometers
- **Detection Accuracy**: > 95% accuracy in automated threat identification

---

## User Personas

### Primary Users

1. **Surveillance Operators**: Monitor live drone feeds and validate AI-detected incidents
2. **Field Commander**: Oversees operations and reviews real-time incident reports
3. **Report Analyst**: Reviews compiled AI detections and generates final mission reports
4. **Drone Operators**: Manage AUTEL drone deployments and hardware connectivity

### Secondary Users

1. **System Administrator**: Manages user accounts and system settings
2. **Technical Support**: Monitors system health and troubleshoots issues

---

## Current Implementation Status

### ✅ **Existing Infrastructure**

#### 1. Live Video Streaming Prototype

- **Status**: Basic Agora SDK integration working
- **Challenge**: Needs AUTEL drone integration to replace HDMI cord setup
- **Features**:
  - Grid layout for multiple streams
  - Modal view for detailed analysis
  - Stream management interface
  - **Gap**: Direct AUTEL drone controller connection

#### 2. Geospatial Intelligence

- **Status**: Functional mapping system
- **Technology**: MapLibre GL JS with coordinate tracking
- **Features**:
  - Interactive mapping with multiple basemaps
  - Real-time position updates
  - **Gap**: Integration with AI detection results

#### 3. Backend Infrastructure (Requires Refactoring)

- **Status**: Monolithic Node.js server
- **Challenge**: Needs separation into standalone API backend
- **Current Features**:
  - Socket.IO real-time communication
  - Basic MQTT telemetry processing
  - **Gap**: API endpoints for NextJS frontend

### 🔄 **Major Architecture Changes Required**

#### 1. Frontend/Backend Separation

- **Current**: Monolithic application serving HTML pages
- **Target**: NextJS frontend + Standalone API backend
- **Reason**: Better maintainability and team development workflow

#### 2. Python AI Model Integration

- **Current**: No AI integration
- **Target**: Python AI service connected to JavaScript backend
- **Challenge**: Cross-language service communication

#### 3. AUTEL Drone Integration

- **Current**: Agora SDK placeholder streams
- **Target**: Direct AUTEL drone controller connection
- **Goal**: Replace unreliable HDMI cord streaming setup

### ⚠️ **UI Mockups Requiring Backend Integration**

#### 1. Command Dashboard

- **Status**: Frontend mockup complete
- **Required Backend**: Real-time metrics aggregation, live data integration
- **Priority**: High

#### 2. Incident Management System

- **Status**: Static interface implemented
- **Required Backend**: Database integration, workflow engine, notification system
- **Priority**: High

#### 3. Threat Detection Module

- **Status**: UI framework only
- **Required Backend**: AI/ML threat detection algorithms, alert processing
- **Priority**: Medium

#### 4. Analytics Dashboard

- **Status**: Navigation shell
- **Required Backend**: Data analytics engine, chart generation, historical data
- **Priority**: Medium

#### 5. User Management System

- **Status**: Interface mockup
- **Required Backend**: Authentication, authorization, role-based access control
- **Priority**: Medium

#### 6. Reporting System

- **Status**: UI mockup
- **Required Backend**: Report generation engine, export functionality, scheduling
- **Priority**: Low

#### 7. System Logs Interface

- **Status**: Navigation placeholder
- **Required Backend**: Log aggregation, filtering, search functionality
- **Priority**: Low

#### 8. AI Detection Module

- **Status**: Navigation shell
- **Required Backend**: Machine learning models, object detection, pattern recognition
- **Priority**: Low

---

## Detailed Feature Requirements

### Phase 1: Critical Infrastructure (HIGHEST PRIORITY)

#### 1.1 Architecture Separation & NextJS Frontend

**User Story**: As a development team, we need to separate the frontend and backend so that we can develop and deploy components independently with better maintainability.

**Requirements**:

- **NextJS Frontend Application**

  - Migrate existing HTML pages to NextJS components
  - Implement responsive design with TailwindCSS
  - Real-time WebSocket connections to backend API
  - Authentication and route protection
  - Component-based architecture for reusability

- **Standalone Backend API**

  - RESTful API endpoints for all frontend operations
  - WebSocket server for real-time updates
  - MQTT telemetry processing service
  - Database connection and ORM setup
  - CORS configuration for NextJS frontend

- **Development Workflow**
  - Separate deployments for frontend and backend
  - API documentation and testing
  - Environment configuration management

**Acceptance Criteria**:

- NextJS frontend can be developed and deployed independently
- Backend provides complete API coverage for all frontend features
- Real-time features work correctly across separated architecture
- Development team can work on frontend/backend simultaneously

#### 1.2 AUTEL Drone Integration & Centralized Streaming

**User Story**: As a Surveillance Operator, I need reliable, lag-free access to multiple AUTEL drone feeds in one place so that I can monitor operations without hardware dependency issues.

**Requirements**:

- **AUTEL Drone Controller Integration**

  - Direct connection to AUTEL drone controllers (replace HDMI setup)
  - Support for multiple simultaneous drone connections
  - Connection status monitoring and automatic reconnection
  - Low-latency streaming (< 500ms) to web platform

- **Multi-User Access**

  - Multiple operators can view same drone feeds simultaneously
  - Individual user controls (zoom, fullscreen, stream selection)
  - Bandwidth optimization for concurrent viewers
  - User session management and access logging

- **Stream Management**
  - Add/remove drone feeds dynamically
  - Stream quality adaptation based on connection
  - Recording capabilities for incident review
  - Stream health monitoring and alerts

**Acceptance Criteria**:

- AUTEL drones connect directly without HDMI cords
- Multiple users can access same feeds simultaneously
- Stream latency is consistently < 500ms
- System handles connection failures gracefully
- Recording function captures incidents for later review

#### 1.3 Python AI Model Integration

**User Story**: As a Surveillance Operator, I need automated incident detection from live drone feeds so that I don't have to manually monitor every stream continuously.

**Requirements**:

- **Python AI Service Architecture**

  - Deploy existing Python AI model as microservice
  - REST/WebSocket API for communication with JavaScript backend
  - Real-time video frame processing from live streams
  - Configurable detection sensitivity and types

- **Cross-Language Communication**

  - HTTP API endpoints for model inference requests
  - WebSocket connection for real-time detection streaming
  - Message queue integration (Redis/RabbitMQ) for scalability
  - Error handling and service health monitoring

- **Detection Processing Pipeline**

  - Video frame extraction from live streams
  - AI model inference on extracted frames
  - Confidence scoring and threshold filtering
  - Detection result formatting for database storage

- **Integration with Backend**
  - JavaScript backend receives AI detection results
  - Real-time forwarding to frontend via WebSocket
  - Database storage of detection events
  - Validation workflow for human review

**Acceptance Criteria**:

- Python AI model processes live video frames in real-time
- Detection results appear in frontend within 2 seconds
- JavaScript backend successfully communicates with Python service
- Detection accuracy matches existing model performance
- System handles AI service failures gracefully

### Phase 2: Automated Workflow (HIGH PRIORITY)

#### 2.1 AI Detection Validation & Database Storage

**User Story**: As a Surveillance Operator, I need to review and validate AI-detected incidents before they're stored so that the database contains accurate, verified information.

**Requirements**:

- **Detection Review Interface**

  - Real-time AI detection alerts with confidence scores
  - Side-by-side view: live feed + detection bounding boxes
  - One-click validation (Confirm/Reject/Flag for Review)
  - Ability to add notes and context to detections

- **Database Schema for AI Detections**

  - Detection table: ID, timestamp, drone_id, detection_type, confidence_score, coordinates, status (pending/confirmed/rejected)
  - Media table: video_clip, screenshot, associated_detection_id
  - Validation table: validated_by, validation_timestamp, notes

- **Validation Workflow**
  - AI detections automatically create pending incidents
  - Operator review queue prioritized by confidence score
  - Bulk validation tools for similar detection types
  - Integration with existing incident management

**Acceptance Criteria**:

- AI detections appear in review queue within 1 second
- Operators can efficiently validate/reject detections
- Database stores all detection metadata and validation status
- Validated detections automatically create incident records

#### 2.2 Automated Report Generation

**User Story**: As a Report Analyst, I need the system to automatically generate PowerPoint/PDF reports from validated AI detections using our existing template so that I don't have to manually write reports after operations.

**Requirements**:

- **Report Template Integration**

  - Import existing PowerPoint/PDF report templates
  - Define dynamic fields for incident data insertion
  - Support for charts, maps, and incident statistics
  - Customizable report sections and layouts

- **Automated Report Compilation**

  - Query validated detections by time range, location, type
  - Generate incident summaries with key statistics
  - Include screenshots and video clips from detections
  - Map visualization of incident locations

- **Report Generation Engine**

  - PowerPoint generation using Python-PPTX or similar
  - PDF generation with charts and embedded media
  - Scheduled report generation (daily, weekly, after operations)
  - Email distribution to stakeholders

- **Report Customization**
  - Filter incidents by severity, type, location
  - Custom date ranges and operational periods
  - Executive summary vs. detailed technical reports
  - Export options: PowerPoint, PDF, Word

**Acceptance Criteria**:

- Reports generate automatically from template with validated incident data
- Generated reports include all required elements (text, charts, media)
- Report generation completes within 2 minutes for typical operations
- Generated reports match existing template format and branding

#### 1.3 User Authentication & Authorization

**User Story**: As a System Administrator, I need role-based access control so that users can only access features appropriate to their responsibilities.

**Requirements**:

- **Authentication System**

  - Login/logout functionality
  - Session management with secure tokens
  - Password requirements and reset functionality
  - Account lockout after failed attempts

- **Authorization Levels**

  - **Admin**: Full system access, user management, configuration
  - **Commander**: Operations overview, incident management, reporting
  - **Operator**: Live feeds, basic incident creation, telemetry monitoring
  - **Analyst**: Read-only access to incidents, reporting, historical data

- **User Management Interface**
  - Create, update, disable user accounts
  - Assign and modify user roles
  - View user activity logs
  - Password reset administration

**Acceptance Criteria**:

- Users can only access features allowed by their role
- Login sessions are secure and properly managed
- User management interface functions correctly
- Activity logging captures all user actions

### Phase 2: Advanced Analytics & Detection (Medium Priority)

#### 2.1 Threat Detection Engine

**User Story**: As a Surveillance Operator, I need automated threat detection so that potential security issues are identified immediately without manual monitoring.

**Requirements**:

- **Detection Categories**

  - Human/vehicle/boat detection in restricted areas
  - Weapon identification in video streams
  - Unusual movement pattern analysis
  - Perimeter breach detection
  - Crowd formation and behavior analysis

- **AI/ML Integration**

  - Object detection models (YOLO, SSD)
  - Behavioral analysis algorithms
  - Confidence scoring (0-100%)
  - False positive reduction mechanisms

- **Alert Processing**
  - Configurable detection thresholds
  - Automatic incident creation for high-confidence detections
  - Multi-source correlation (video + telemetry)
  - Notification routing based on threat type and severity

- **WebSocket Data Contract** (Backend at `136.116.89.216`)

  The backend emits two event types via Socket.IO:

  **`YOLO_DETECTION`** — Live YOLO alert (Orange Panel)

  ```typescript
  interface YoloDetectionEvent {
    streamId: string;
    detections: Array<{
      // Bounding box (normalized 0-1)
      x: number;
      y: number;
      width: number;
      height: number;

      // Detection metadata
      score: number;           // YOLO confidence [0,1]
      class: string;           // e.g. 'person', 'vehicle'
      trackId: number;         // IoU tracking ID
      objectKey?: string;      // MinIO crop key (relative path)

      // Media
      imageUrl: string | null; // Presigned MinIO URL (24h expiry), null if failed

      // Dual GPS coordinates
      latitude: number | null;    // Drone GPS lat (where the drone was when detection occurred)
      longitude: number | null;   // Drone GPS lon
      objectLatitude: number | null;  // Detected object's GPS lat (if resolvable)
      objectLongitude: number | null; // Detected object's GPS lon (if resolvable)
    }>;
    timestamp: number;         // Date.now()
  }
  ```

  **`TRACK_CONFIRMED`** — LLM verified threat (Red Panel)

  ```typescript
  interface TrackConfirmedEvent {
    streamId: string;
    detections: Array<{
      // Bounding box
      x: number;
      y: number;
      width: number;
      height: number;

      // Detection metadata
      class: string;
      trackId: number;
      score: number;

      // LLM verification
      reasoning: string;       // Gemini LLM explanation

      // Media
      imageUrl: string | null;

      // Dual GPS coordinates
      latitude: number | null;      // Drone GPS lat
      longitude: number | null;     // Drone GPS lon
      objectLatitude: number | null;   // Object GPS lat
      objectLongitude: number | null;  // Object GPS lon
    }>;
    timestamp: number;
  }
  ```

  **Dual GPS Coordinate System**:
  - `latitude`/`longitude`: The drone's position when the detection was made (always available if drone has GPS fix)
  - `objectLatitude`/`objectLongitude`: The detected object's geolocation (null if not resolvable from video, e.g., distant objects without depth data)

**Acceptance Criteria**:

- Detection accuracy > 90% with < 5% false positive rate
- Alerts generated within 1 second of detection
- Incidents automatically created for verified threats
- Detection settings can be configured per deployment area
- Frontend displays both drone position and object position on map when available
- Orange panel shows live YOLO detections, Red panel shows LLM-verified threats

#### 2.2 Analytics Dashboard

**User Story**: As an Intelligence Analyst, I need historical data analysis and visualization so that I can identify trends and patterns for strategic planning.

**Requirements**:

- **Data Visualization**

  - Incident trends over time (daily, weekly, monthly)
  - Threat distribution by type and location
  - Regional activity heatmaps
  - System performance metrics and uptime statistics

- **Historical Analysis**

  - Time-range filtering (last 24 hours, week, month, custom)
  - Comparison tools (current vs. previous periods)
  - Pattern recognition and anomaly detection
  - Predictive analytics for resource planning

- **Export Capabilities**
  - PDF report generation
  - CSV data export for external analysis
  - Chart image exports
  - Scheduled automated reports

**Acceptance Criteria**:

- Charts display accurate data from historical records
- Filtering and date range selection works correctly
- Export functions produce properly formatted outputs
- Dashboard loads within 3 seconds for standard date ranges

### Phase 3: Enhanced Features (Low Priority)

#### 3.1 Advanced Reporting System

- Automated daily/weekly/monthly operational reports
- Custom report builder with drag-and-drop interface
- Multi-format export (PDF, Excel, Word, PowerPoint)
- Scheduled report distribution via email

#### 3.2 System Monitoring & Logs

- Centralized log aggregation from all system components
- Real-time log filtering and search functionality
- System health monitoring and alerting
- Performance metrics and capacity planning tools

#### 3.3 AI-Powered Analytics

- Machine learning models for pattern recognition
- Predictive analytics for threat forecasting
- Natural language processing for incident analysis
- Computer vision enhancements for detection accuracy

---

## Technical Requirements

### New Architecture Design

#### Frontend (NextJS)

- **Framework**: NextJS with TypeScript
- **Styling**: TailwindCSS with custom dark theme
- **State Management**: React Context or Zustand for global state
- **Real-time**: Socket.IO client for live updates
- **Mapping**: MapLibre GL JS for geospatial visualization
- **Video**: Agora SDK for drone streaming
- **Charts**: Chart.js for analytics and reporting

#### Backend API (Node.js)

- **Framework**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: JWT tokens with role-based access
- **File Storage**: Local storage or cloud (AWS S3) for video clips
- **API Documentation**: Swagger/OpenAPI specification

#### AI Service (Python)

- **Framework**: FastAPI for REST API
- **Model**: Existing Python AI model for incident detection
- **Communication**: HTTP REST + WebSocket for real-time processing
- **Image Processing**: OpenCV, PIL for video frame analysis
- **Message Queue**: Redis or RabbitMQ for task queuing

#### Hardware Integration

- **AUTEL Drones**: Direct controller connection via RTSP/UDP streams
- **Video Processing**: FFmpeg for stream ingestion and processing
- **Networking**: Support for multiple drone controller IP addresses
- **Fallback**: Agora SDK as backup streaming solution

### Infrastructure Requirements

- **Deployment**: Docker containers with orchestration
- **Monitoring**: Application performance monitoring and logging
- **Security**: HTTPS, secure WebSocket connections, input validation
- **Scalability**: Load balancing, database replication, CDN for static assets

### Performance Requirements

- **Response Time**: < 2 seconds for all user interactions
- **Video Latency**: < 500ms for live streaming
- **Concurrent Users**: Support 50+ simultaneous active users
- **Data Processing**: Real-time processing of 10+ video streams
- **Uptime**: 99.9% availability with < 10 minutes downtime per month

### Security Requirements

- **Authentication**: Multi-factor authentication for admin accounts
- **Authorization**: Role-based access control with principle of least privilege
- **Data Encryption**: End-to-end encryption for sensitive communications
- **Audit Logging**: Comprehensive logging of all user actions and system events
- **Compliance**: Adherence to applicable military and security standards

---

## Implementation Timeline

### Phase 1: Architecture & Streaming (6-8 weeks)

- **Week 1-2**: Backend API development and database setup
- **Week 3-4**: NextJS frontend migration and component development
- **Week 5-6**: AUTEL drone integration and centralized streaming
- **Week 7-8**: Multi-user access and stream management testing

### Phase 2: AI Integration & Workflow (8-10 weeks)

- **Week 1-3**: Python AI service deployment and API integration
- **Week 4-5**: Detection validation interface and workflow
- **Week 6-7**: Database storage and incident management
- **Week 8-10**: End-to-end testing and performance optimization

### Phase 3: Automated Reporting (4-6 weeks)

- **Week 1-2**: Report template integration and generation engine
- **Week 3-4**: PowerPoint/PDF generation with incident data
- **Week 5-6**: Scheduled reporting and distribution system

### Phase 4: Enhancement & Deployment (2-4 weeks)

- **Week 1-2**: User training and documentation
- **Week 3-4**: Production deployment and monitoring setup

---

## Success Criteria

### MVP Success Criteria (Phase 1-2)

- [ ] AUTEL drones stream directly to web platform without HDMI cords
- [ ] Multiple operators can view same drone feeds simultaneously
- [ ] Python AI model successfully detects incidents from live streams
- [ ] AI detections are validated and stored in database
- [ ] NextJS frontend and standalone backend work independently

### Full Product Success Criteria (All Phases)

- [ ] Automated report generation produces PowerPoint/PDF reports from template
- [ ] Complete elimination of manual report writing for standard operations
- [ ] System handles 5+ AUTEL drones streaming simultaneously
- [ ] AI detection accuracy matches existing model performance (>85%)
- [ ] Report generation time reduced from hours to minutes
- [ ] Zero dependency on HDMI cords or Google Meet for drone streaming

---

## Risk Assessment

### High Risk

- **AUTEL Drone Integration**: Unknown technical specifications for direct controller connection
- **Python-JavaScript Integration**: Cross-language service communication complexity
- **Hardware Compatibility**: AUTEL controller network protocols and streaming capabilities

### Medium Risk

- **AI Model Performance**: Existing Python model performance in real-time web environment
- **Report Template Integration**: Complexity of automating PowerPoint/PDF generation
- **Stream Reliability**: Maintaining consistent low-latency streaming for multiple drones

### Low Risk

- **NextJS Migration**: Well-established framework with clear migration path
- **Database Design**: Standard relational data structure for incidents and detections
- **User Interface**: Existing mockups provide clear development requirements

---

## Appendix

### A. Current System Architecture

- **Backend**: Node.js server running on port 5000
- **Frontend**: Multi-page application with shared navigation
- **Database**: File-based storage (requires migration to proper database)
- **Real-time**: Socket.IO WebSocket integration
- **Video Processing**: FFmpeg pipeline with OCR extraction

### B. Existing Integrations

- **Agora SDK**: Video streaming platform integration
- **MapLibre GL JS**: Interactive mapping library
- **TailwindCSS**: Utility-first CSS framework
- **Font Awesome**: Icon library for UI elements

### C. Development Environment

- **Platform**: Replit cloud development environment
- **Deployment**: Single server deployment with workflow automation
- **Version Control**: Git-based source control
- **Package Management**: npm for Node.js dependencies

---

_This PRD serves as the primary specification document for ISR Command & Control System development. All feature implementations should reference this document for requirements validation and acceptance criteria._
