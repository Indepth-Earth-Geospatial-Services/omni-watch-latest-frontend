<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Detection - ISR C&C</title>
    <script src="/socket.io/socket.io.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            fontFamily: { sans: ["Inter", "sans-serif"] },
            colors: {
              primary: "#2563eb",
              secondary: "#64748b",
              accent: "#0f172a",
              darkbg: "#0a0a0a", // main page background
              graybg: "#1f1f1f", // secondary bg (cards, panels)
              card: "#171717", // panels, cards
            },
          },
        },
      };
    </script>


    <link rel="stylesheet" href="style.css" />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      rel="stylesheet"
    />


    <style>
      .detection-box {
        position: absolute;
        border: 2px solid #10b981;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 4px;
        pointer-events: none;
      }


      .detection-label {
        position: absolute;
        top: -25px;
        left: 0;
        background: #10b981;
        color: white;
        padding: 2px 8px;
        font-size: 12px;
        border-radius: 3px;
        font-weight: bold;
        white-space: nowrap;
      }


      .feed-container {
        position: relative;
        background: #111;
        border-radius: 8px;
        overflow: hidden;
      }


      .feed-placeholder {
        width: 100%;
        height: 200px;
        background: linear-gradient(45deg, #1f2937, #374151);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        position: relative;
      }


      .detection-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }


      .confidence-bar {
        width: 100%;
        height: 4px;
        background: #374151;
        border-radius: 2px;
        overflow: hidden;
      }


      .confidence-fill {
        height: 100%;
        background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
        transition: width 0.3s ease;
      }


      @keyframes pulse-detection {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }


      .detection-active {
        animation: pulse-detection 1.5s infinite;
      }


      .feed-type-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: bold;
      }


      .drone-badge {
        background: #3b82f6;
        color: white;
      }
      .bodycam-badge {
        background: #8b5cf6;
        color: white;
      }
      .cctv-badge {
        background: #10b981;
        color: white;
      }
    </style>
  </head>


  <body class="bg-darkbg text-gray-100 transition-colors duration-300">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 w-64 bg-card border-r border-gray-800 flex flex-col"
    >
      <div
        class="flex items-center justify-between h-16 px-4 border-b border-gray-800"
      >
        <h1 class="text-lg font-bold text-sky-400">
          <i class="fas fa-satellite-dish mr-2"></i>ISR C&C
        </h1>
      </div>


      <nav class="mt-4 flex-1 space-y-1">
        <a
          href="dashboard.html"
          class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-tachometer-alt mr-3"></i> Dashboard</a
        >


        <a href="index.html" class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-video mr-3"></i> Live Feeds</a
        >


        <a
          href="geospatial.html"
          class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-globe mr-3"></i> Geospatial Map</a
        >


        <a
          href="incident.html"
          class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-exclamation-triangle mr-3"></i> Incidents</a
        >


        <a
          href="threat.html"
          class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-bullseye mr-3"></i> Threat Detection</a
        >


        <a
          href="aiDetection.html"
          class="flex items-center px-4 py-3 bg-graybg border-l-2 border-sky-500"
          ><i class="fas fa-brain mr-3"></i> AI Detection</a
        >


        <a
          href="analytics.html"
          class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-chart-line mr-3"></i> Analytics</a
        >


        <a
          href="reports.html"
          class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-file-alt mr-3"></i> Reports</a
        >


        <a href="user.html" class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-users mr-3"></i> User Management</a
        >


        <a href="logs.html" class="flex items-center px-4 py-3 hover:bg-graybg"
          ><i class="fas fa-terminal mr-3"></i> System Logs</a
        >
      </nav>


      <div class="p-4 border-t border-gray-800">
        <p class="text-sm text-gray-400">
          John Doe<br /><span class="text-xs">Admin</span>
        </p>
        <a href="#" class="text-xs text-red-500 mt-2 inline-block"
          ><i class="fas fa-sign-out-alt"></i> Sign Out</a
        >
      </div>
    </aside>


    <!-- Main Content -->
    <div id="main-content" class="lg:ml-64 transition-all duration-300">
      <!-- Header -->
      <header id="header" class="bg-card shadow-sm border-b border-gray-700">
        <div class="flex items-center justify-between h-16 px-4">
          <div class="flex items-center">
            <button
              id="toggleSidebar"
              class="lg:hidden p-2 rounded-md hover:bg-darkbg transition-colors mr-4"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
            <h2 class="font-semibold text-2xl">
              <i class="fas fa-brain text-purple-500 mr-2"></i>AI Pipeline
              Surveillance
            </h2>
          </div>


          <div class="flex items-center space-x-3">
            <button
              class="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors"
            >
              <i class="fas fa-cog mr-2"></i>Model Settings
            </button>
            <button
              class="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors"
            >
              <i class="fas fa-save mr-2"></i>Export Detections
            </button>
            <button
              id="toggleDetection"
              class="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              <i class="fas fa-play mr-2"></i>Start Detection
            </button>
          </div>
        </div>
      </header>


      <!-- Main Content Area -->
      <div class="p-6 space-y-6">
        <!-- AI Performance Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div class="bg-card p-6 rounded-lg border border-gray-800">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-purple-500 bg-opacity-10 rounded-lg">
                <i class="fas fa-brain text-purple-500 text-xl"></i>
              </div>
              <div>
                <p
                  class="text-2xl font-bold text-gray-100"
                  id="totalDetections"
                >
                  0
                </p>
                <p class="text-sm text-gray-400">Total Detections</p>
              </div>
            </div>
          </div>


          <div class="bg-card p-6 rounded-lg border border-gray-800">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-red-500 bg-opacity-10 rounded-lg">
                <i class="fas fa-user text-red-500 text-xl"></i>
              </div>
              <div>
                <p
                  class="text-2xl font-bold text-gray-100"
                  id="personDetections"
                >
                  0
                </p>
                <p class="text-sm text-gray-400">Persons</p>
              </div>
            </div>
          </div>


          <div class="bg-card p-6 rounded-lg border border-gray-800">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-orange-500 bg-opacity-10 rounded-lg">
                <i class="fas fa-car text-orange-500 text-xl"></i>
              </div>
              <div>
                <p
                  class="text-2xl font-bold text-gray-100"
                  id="vehicleDetections"
                >
                  0
                </p>
                <p class="text-sm text-gray-400">Vehicles</p>
              </div>
            </div>
          </div>


          <div class="bg-card p-6 rounded-lg border border-gray-800">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-yellow-500 bg-opacity-10 rounded-lg">
                <i class="fas fa-box text-yellow-500 text-xl"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-100" id="objectDetections">
                  0
                </p>
                <p class="text-sm text-gray-400">Objects</p>
              </div>
            </div>
          </div>


          <div class="bg-card p-6 rounded-lg border border-gray-800">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-blue-500 bg-opacity-10 rounded-lg">
                <i class="fas fa-percentage text-blue-500 text-xl"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-100" id="accuracy">
                  0%
                </p>
                <p class="text-sm text-gray-400">Avg Confidence</p>
              </div>
            </div>
          </div>


          <div class="bg-card p-6 rounded-lg border border-gray-800">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-green-500 bg-opacity-10 rounded-lg">
                <i class="fas fa-clock text-green-500 text-xl"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-100" id="responseTime">
                  0s
                </p>
                <p class="text-sm text-gray-400">Last Detection</p>
              </div>
            </div>
          </div>
        </div>


        <!-- AI Model Status and Controls -->
        <div class="bg-card p-4 rounded-lg border border-gray-800">
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <!-- Model Status -->
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 bg-green-500 rounded-full animate-pulse"
                ></div>
                <span class="text-sm font-medium text-gray-300"
                  >Pipeline AI Model Active</span
                >
              </div>
              <div class="text-sm text-gray-400">
                <span>Custom CNN | Confidence: 0.7</span>
              </div>
            </div>


            <!-- Detection Filters -->
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <label
                  class="text-sm font-medium whitespace-nowrap text-gray-300"
                >
                  Feed Type:
                </label>
                <select
                  id="feedTypeFilter"
                  class="px-3 py-2 bg-darkbg border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Feeds</option>
                  <option value="drone">Drone Surveillance</option>
                  <option value="bodycam">Body Cameras</option>
                  <option value="cctv">CCTV Cameras</option>
                </select>
              </div>


              <div class="flex items-center space-x-2">
                <label
                  class="text-sm font-medium whitespace-nowrap text-gray-300"
                >
                  Threat Type:
                </label>
                <select
                  id="threatFilter"
                  class="px-3 py-2 bg-darkbg border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Threats</option>
                  <option value="oil_spill">Oil Spill</option>
                  <option value="illegal_refinery">Illegal Refinery</option>
                  <option value="pipeline_damage">Pipeline Damage</option>
                  <option value="unauthorized_access">
                    Unauthorized Access
                  </option>
                  <option value="excavation">Excavation Activity</option>
                </select>
              </div>


              <div class="flex items-center space-x-2">
                <label
                  class="text-sm font-medium whitespace-nowrap text-gray-300"
                >
                  Confidence:
                </label>
                <select
                  id="confidenceFilter"
                  class="px-3 py-2 bg-darkbg border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0.5">≥ 50%</option>
                  <option value="0.7" selected>≥ 70%</option>
                  <option value="0.8">≥ 80%</option>
                  <option value="0.9">≥ 90%</option>
                </select>
              </div>
            </div>
          </div>
        </div>


        <!-- Live Feed Grid with AI Detection -->
        <div class="bg-card rounded-lg border border-gray-800">
          <div class="p-4 border-b border-gray-800">
            <h3 class="text-lg font-semibold flex items-center">
              <i class="fas fa-video text-blue-500 mr-2"></i>
              <span>Pipeline Surveillance Feeds</span>
              <span class="ml-4 text-sm text-gray-400"
                >(<span id="activeFeedCount">9</span> active)</span
              >
            </h3>
          </div>


          <div class="p-6">
            <div
              id="feedGrid"
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            >
              <!-- Live YOLO Detection Feed -->
              <div class="bg-graybg rounded-lg overflow-hidden">
                <div class="feed-container" style="position: relative; background: #111; border-radius: 8px; overflow: hidden;">
                  <img id="yolo-feed" style="width: 100%; height: 100%; object-fit: contain; display: block;" alt="YOLO Detection Feed" />
                  <div class="feed-type-badge drone-badge" style="position: absolute; top: 8px; right: 8px; font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: bold; background: #3b82f6; color: white;">
                    LIVE
                  </div>
                </div>
                <div class="p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-sm">YOLO Detection Feed</h4>
                    <span id="feed-status" class="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                      CONNECTING
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 mb-2">Real-time Object Detection</p>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-gray-400" id="feed-info">Waiting for stream...</span>
                      <span class="text-blue-400" id="feed-fps">0 FPS</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>


        <!-- Recent Detections Log -->
        <div class="bg-card rounded-lg border border-gray-800">
          <div class="p-4 border-b border-gray-800">
            <h3 class="text-lg font-semibold flex items-center">
              <i class="fas fa-list-alt text-green-500 mr-2"></i>
              <span>Recent Detections</span>
            </h3>
          </div>


          <div class="p-4">
            <div id="detectionLog" class="space-y-3 max-h-64 overflow-y-auto">
              <div class="text-center text-gray-400 py-8">
                No detections yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Overlay -->
    <div
      id="sidebarOverlay"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden hidden"
    ></div>


    <script>
      // Detection statistics
      const detectionStats = {
        totalDetections: 0,
        personDetections: 0,
        vehicleDetections: 0,
        objectDetections: 0,
        avgConfidence: 0,
        lastDetectionTime: null,
      };


      let detectionActive = false;
      let ws = null;
      let socket = null;
      let frameCount = 0;
      let lastFrameTime = Date.now();
      const WEBSOCKET_URL = "ws://localhost:6060/ws";
      const RECONNECT_INTERVAL = 3000;
      const MAX_LOG_ENTRIES = 20;


      // Object type categories
      const VEHICLE_TYPES = ['car', 'motorcycle', 'bus', 'truck', 'bicycle'];
      const PERSON_TYPES = ['person'];


      // Initialize page
      document.addEventListener("DOMContentLoaded", function () {
        setupFilters();
        setupSidebar();
        setupDetectionToggle();
        connectWebSocket();
        connectSocketIO();
      });


      function connectSocketIO() {
        socket = io();


        socket.on('connect', () => {
          console.log('Connected to Socket.IO server');
        });


        socket.on('newDetection', (detection) => {
          handleNewDetection(detection);
        });


        socket.on('disconnect', () => {
          console.log('Disconnected from Socket.IO server');
        });
      }


      function handleNewDetection(detection) {
        const { object_type, confidence, track_id, timestamp } = detection;


        // Update statistics
        detectionStats.totalDetections++;
        detectionStats.lastDetectionTime = Date.now();


        // Categorize detection
        if (PERSON_TYPES.includes(object_type.toLowerCase())) {
          detectionStats.personDetections++;
        } else if (VEHICLE_TYPES.includes(object_type.toLowerCase())) {
          detectionStats.vehicleDetections++;
        } else {
          detectionStats.objectDetections++;
        }


        // Update average confidence
        const currentAvg = detectionStats.avgConfidence;
        const total = detectionStats.totalDetections;
        detectionStats.avgConfidence = ((currentAvg * (total - 1)) + (confidence * 100)) / total;


        // Update UI
        updateStats();
        addDetectionToLog(detection);
      }


      function addDetectionToLog(detection) {
        const { object_type, confidence, track_id, timestamp } = detection;
        const logContainer = document.getElementById('detectionLog');


        // Remove "No detections yet" message if it exists
        const emptyMessage = logContainer.querySelector('.text-center');
        if (emptyMessage) {
          emptyMessage.remove();
        }


        // Create new detection entry
        const detectionEntry = document.createElement('div');
        detectionEntry.className = 'flex items-center justify-between p-3 bg-graybg rounded-lg';


        // Determine color based on object type
        let colorClass = 'green';
        if (PERSON_TYPES.includes(object_type.toLowerCase())) {
          colorClass = 'blue';
        } else if (VEHICLE_TYPES.includes(object_type.toLowerCase())) {
          colorClass = 'orange';
        }


        const timeAgo = 'Just now';


        detectionEntry.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-${colorClass}-500 rounded-full animate-pulse"></div>
            <div>
              <p class="text-sm font-medium text-${colorClass}-400">
                ${object_type.charAt(0).toUpperCase() + object_type.slice(1)} Detected
              </p>
              <p class="text-xs text-gray-400">
                ID: ${track_id} • ${(confidence * 100).toFixed(1)}% confidence
              </p>
            </div>
          </div>
          <span class="text-xs text-gray-500">${timeAgo}</span>
        `;


        // Add to top of log
        logContainer.insertBefore(detectionEntry, logContainer.firstChild);


        // Limit log entries
        while (logContainer.children.length > MAX_LOG_ENTRIES) {
          logContainer.removeChild(logContainer.lastChild);
        }
      }


      function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) return;


        ws = new WebSocket(WEBSOCKET_URL);


        ws.onopen = () => {
          document.getElementById("feed-status").textContent = "CONNECTED";
          document.getElementById("feed-status").className = "text-xs bg-green-600 text-white px-2 py-1 rounded";
          document.getElementById("feed-info").textContent = "Stream active";
        };


        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);


            if (message.type === 'frame') {
              const imgElement = document.getElementById('yolo-feed');
              imgElement.src = 'data:image/jpeg;base64,' + message.data;


              // Calculate FPS
              frameCount++;
              const now = Date.now();
              const elapsed = now - lastFrameTime;
              if (elapsed >= 1000) {
                const fps = Math.round((frameCount * 1000) / elapsed);
                document.getElementById("feed-fps").textContent = fps + " FPS";
                frameCount = 0;
                lastFrameTime = now;
              }
            }
          } catch (error) {
            console.error("Error processing frame:", error);
          }
        };


        ws.onclose = () => {
          document.getElementById("feed-status").textContent = "DISCONNECTED";
          document.getElementById("feed-status").className = "text-xs bg-red-600 text-white px-2 py-1 rounded";
          document.getElementById("feed-info").textContent = "Reconnecting...";


          setTimeout(() => {
            connectWebSocket();
          }, RECONNECT_INTERVAL);
        };


        ws.onerror = (error) => {
          document.getElementById("feed-status").textContent = "ERROR";
          document.getElementById("feed-status").className = "text-xs bg-red-600 text-white px-2 py-1 rounded";
          ws.close();
        };
      }


      function updateStats() {
        document.getElementById("totalDetections").textContent =
          detectionStats.totalDetections;
        document.getElementById("personDetections").textContent =
          detectionStats.personDetections;
        document.getElementById("vehicleDetections").textContent =
          detectionStats.vehicleDetections;
        document.getElementById("objectDetections").textContent =
          detectionStats.objectDetections;
        document.getElementById("accuracy").textContent =
          detectionStats.avgConfidence.toFixed(1) + "%";


        if (detectionStats.lastDetectionTime) {
          const secondsAgo = Math.floor((Date.now() - detectionStats.lastDetectionTime) / 1000);
          document.getElementById("responseTime").textContent = secondsAgo + "s";
        } else {
          document.getElementById("responseTime").textContent = "0s";
        }
      }


      function setupFilters() {
        const feedTypeFilter = document.getElementById("feedTypeFilter");
        const threatFilter = document.getElementById("threatFilter");
        const confidenceFilter = document.getElementById("confidenceFilter");


        if (feedTypeFilter) {
          feedTypeFilter.addEventListener("change", applyFilters);
        }
        if (threatFilter) {
          threatFilter.addEventListener("change", applyFilters);
        }
        if (confidenceFilter) {
          confidenceFilter.addEventListener("change", applyFilters);
        }
      }


      function applyFilters() {
        // Filter logic will be implemented when feeds are added dynamically
      }


      function setupDetectionToggle() {
        const toggleBtn = document.getElementById("toggleDetection");


        if (toggleBtn) {
          toggleBtn.addEventListener("click", function () {
            detectionActive = !detectionActive;


            if (detectionActive) {
              toggleBtn.innerHTML =
                '<i class="fas fa-stop mr-2"></i>Stop Detection';
              toggleBtn.className =
                "px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors";
            } else {
              toggleBtn.innerHTML =
                '<i class="fas fa-play mr-2"></i>Start Detection';
              toggleBtn.className =
                "px-3 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-md transition-colors";
            }
          });
        }
      }


      function setupSidebar() {
        const toggleSidebar = document.getElementById("toggleSidebar");
        const sidebar = document.querySelector("aside");
        const overlay = document.getElementById("sidebarOverlay");
        const mainContent = document.getElementById("main-content");


        if (toggleSidebar) {
          toggleSidebar.addEventListener("click", function () {
            sidebar.classList.toggle("-translate-x-full");
            overlay.classList.toggle("hidden");
            mainContent.classList.toggle("lg:ml-64");
          });
        }


        if (overlay) {
          overlay.addEventListener("click", function () {
            sidebar.classList.add("-translate-x-full");
            overlay.classList.add("hidden");
            mainContent.classList.add("lg:ml-64");
          });
        }
      }
    </script>
  </body>
</html>


