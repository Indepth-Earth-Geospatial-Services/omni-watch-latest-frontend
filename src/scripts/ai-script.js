<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Agora → Python YOLO → WebSocket Viewer</title>
    <script src="https://download.agora.io/sdk/release/AgoraRTC_N.js"></script>
    <style>
        /* Minimal CSS to display the video frame */
        body {
            background: #111;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        #processed-player {
            width: 960px; /* Adjust size as needed */
            height: 540px; /* Adjust size as needed */
            background: #000;
            border: 1px solid #444;
            overflow: hidden;
        }
        #video-frame {
            width: 100%;
            height: 100%;
            object-fit: contain; /* Ensures video fits within container */
            display: block;
        }
    </style>
</head>
<body>
    <div id="processed-player">
        <img id="video-frame" alt="Processed Video Stream" />
    </div>


    <script>
        // --- CONFIGURATION ---
        // REPLACE THESE WITH YOUR ACTUAL Agora details
        const APP_ID = "08b35d883f6b439697f47a25ce621e24";
        const CHANNEL = "1581F5FJD238900D79WS";
        const TOKEN = "0063f7b9f350e934985b7c01e221178fb85IAC+xZWTzUmobzZwJ5byg4NnaQMjy74oVZ/faMGwsWkDjXaeOnIh39v0IgBEOKdCo3jnaAQAAQAjtA1pAgAjtA1pAwAjtA1pBAAjtA1p";
       
        const PYTHON_SERVER = "http://localhost:6060";
        const WEBSOCKET_URL = "ws://localhost:6060/ws";
        const RECONNECT_INTERVAL_MS = 3000;
        const MAX_RETRY_ATTEMPTS = 10; // Maximum retry attempts before giving up
        const RETRY_DELAY_MS = 5000;   // Delay between retry attempts


        let client;
        let sendPC = null; // PeerConnection for sending stream to Python
        let ws = null;     // WebSocket for receiving processed stream
        let currentVideoTrack = null; // Store current video track for retry
        let retryAttempts = 0; // Track retry attempts


        // Helper function (without console logs)
        function cleanupConnections() {
            if (sendPC) {
                sendPC.close();
                sendPC = null;
            }
            if (ws) {
                ws.close();
                ws = null;
            }
        }
       
        // Helper function (without console logs)
        async function waitForIceGathering(pc) {
            return new Promise((resolve) => {
                if (pc.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    // Set a timeout to prevent infinite wait,
                    // even if the state never reaches 'complete'.
                    const timeout = setTimeout(() => resolve(), 5000);


                    pc.onicegatheringstatechange = () => {
                        if (pc.iceGatheringState === 'complete') {
                            clearTimeout(timeout);
                            resolve();
                        }
                    };
                }
            });
        }


        /**
         * 1. Connects to WebSocket for processed frames.
         * 2. Initializes Agora connection.
         */
        async function init() {
            // 1. WebSocket Setup (Receive Processed Stream)
            connectWebSocket();


            try {
                // 2. Agora Setup (Receive Remote Stream)
                client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });


                await client.join(APP_ID, CHANNEL, TOKEN, null);


                // Event handler when a remote user publishes video
                client.on("user-published", async (user, mediaType) => {
                    if (mediaType === "video") {
                        await client.subscribe(user, mediaType);
                        // Store track for retry and reset retry counter
                        currentVideoTrack = user.videoTrack;
                        retryAttempts = 0;
                        // 3. Forward the received video track to the Python backend
                        await forwardToPython(user.videoTrack);
                    }
                });


                client.on("user-unpublished", (user, mediaType) => {
                    if (mediaType === "video") {
                        // Clean up forwarding connection when the remote user stops publishing
                        cleanupConnections();
                        // Re-initialize WebSocket connection in case it needs refreshing
                        connectWebSocket();
                    }
                });


            } catch (error) {
                // Suppress detailed error logs
                // console.error(`Failed to initialize: ${error.message}`);
            }
        }
       
        /**
         * Connects to the WebSocket and handles incoming video frames.
         */
        function connectWebSocket() {
            if (ws && ws.readyState === WebSocket.OPEN) return;


            ws = new WebSocket(WEBSOCKET_URL);


            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                   
                    if (message.type === 'frame') {
                        const imgElement = document.getElementById('video-frame');
                        // Core functionality: update image with base64 encoded JPEG
                        imgElement.src = 'data:image/jpeg;base64,' + message.data;
                    }
                } catch (error) {
                    // Suppress error logs
                }
            };


            ws.onclose = () => {
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    connectWebSocket();
                }, RECONNECT_INTERVAL_MS);
            };


            ws.onerror = (error) => {
                // Let onclose handle the reconnection attempt
                ws.close();
            };
        }




        /**
         * Retry mechanism to reconnect to Python server
         */
        function retryConnection() {
            retryAttempts++;
            const delay = RETRY_DELAY_MS * retryAttempts; // Exponential backoff


            setTimeout(() => {
                if (currentVideoTrack) {
                    forwardToPython(currentVideoTrack);
                }
            }, delay);
        }


        /**
         * Establishes a WebRTC PeerConnection to send the Agora video stream to Python.
         */
        async function forwardToPython(videoTrack) {
            try {
                // Close existing connection if any
                if (sendPC) {
                    sendPC.close();
                }


                const mediaStreamTrack = videoTrack.getMediaStreamTrack();
                const streamId = `agora_remote_${Date.now()}`; // Unique ID for the stream


                // ========== SEND STREAM TO PYTHON ==========
                sendPC = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
                });


                const sendIceCandidates = [];
                sendPC.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendIceCandidates.push(event.candidate);
                    }
                };


                // Monitor connection state for disconnections
                sendPC.onconnectionstatechange = () => {
                    if (sendPC.connectionState === 'failed' || sendPC.connectionState === 'disconnected') {
                        // Trigger retry if we have a stored track
                        if (currentVideoTrack && retryAttempts < MAX_RETRY_ATTEMPTS) {
                            retryConnection();
                        }
                    }
                };


                // Add the track to the PeerConnection
                sendPC.addTrack(mediaStreamTrack, new MediaStream([mediaStreamTrack]));


                // Create offer
                const offer = await sendPC.createOffer({
                    offerToReceiveVideo: false,
                    offerToReceiveAudio: false
                });
                await sendPC.setLocalDescription(offer);


                // Wait for ICE gathering before sending the SDP
                await waitForIceGathering(sendPC);


                // Send offer to Python server
                const res = await fetch(`${PYTHON_SERVER}/consume`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sdp: sendPC.localDescription.sdp,
                        type: sendPC.localDescription.type,
                        // Include stream_id in the payload
                        stream_id: streamId,
                        ice_candidates: sendIceCandidates
                    })
                });


                if (!res.ok) {
                    throw new Error(`Server responded with ${res.status}`);
                }


                const answer = await res.json();
                await sendPC.setRemoteDescription(new RTCSessionDescription(answer));


                // Add remote ICE candidates if provided
                if (answer.ice_candidates && Array.isArray(answer.ice_candidates)) {
                    for (const candidate of answer.ice_candidates) {
                        await sendPC.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }


                // Reset retry counter on successful connection
                retryAttempts = 0;


            } catch (error) {
                // Trigger retry if we have a stored track
                if (currentVideoTrack && retryAttempts < MAX_RETRY_ATTEMPTS) {
                    retryConnection();
                }
            }
        }


        // Auto-start on page load
        window.onload = init;


        // Cleanup on page unload
        window.onbeforeunload = () => {
            cleanupConnections();
            if (client) {
                client.leave();
            }
        };
    </script>
</body>
</html>









