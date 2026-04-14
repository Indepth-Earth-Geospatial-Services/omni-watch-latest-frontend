const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mqtt = require("mqtt");
const path = require("path");

const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const { createWorker } = require("tesseract.js");

(async () => {
  const worker = await createWorker("eng");

  ffmpeg("rtsp://192.168.1.153:1554/live/1")
    .setFfmpegPath(ffmpegPath)
    .inputOptions(["-rtsp_transport", "tcp", "-fflags", "nobuffer"])
    .outputOptions([
      // Crop text region & boost contrast
      "-vf",
      "fps=1,crop=400:100:0:380,eq=contrast=2.0:brightness=0.05:gamma=1.2,unsharp",
    ])
    .format("image2pipe")
    .on("start", () => console.log("Starting OCR..."))
    .on("error", (err) => console.error("FFmpeg error:", err))
    .pipe()
    .on("data", async (chunk) => {
      try {
        const {
          data: { text },
        } = await worker.recognize(chunk, {
          tessedit_char_whitelist: "0123456789.NSEW ",
        });

        let clean = text.replace(/\s+/g, " ").trim();

        // Fix split coords ("N4 838087" -> "N4838087")
        clean = clean.replace(/N(\d)\s+(\d{5,})/i, "N$1$2");
        clean = clean.replace(/E(\d)\s+(\d{5,})/i, "E$1$2");

        console.log("OCR Cleaned:", clean);

        // Match decimals (if the dot is seen)
        let regex = /E(\d+\.\d+)\s+N(\d+\.\d+)/i;
        let match = clean.match(regex);

        // Fallback: integers only
        if (!match) {
          regex = /E(\d+)\s+N(\d+)/i;
          const fallback = clean.match(regex);
          if (fallback) {
            match = [
              null,
              fallback[1][0] + "." + fallback[1].slice(1),
              fallback[2][0] + "." + fallback[2].slice(1),
            ];
          }
        }

        if (match) {
          const lon = parseFloat(match[1]);
          const lat = parseFloat(match[2]);
          console.log(`✅ Coordinates: Lat=${lat}, Lon=${lon}`);
        }
      } catch (err) {
        console.error("OCR error:", err.message);
      }
    });
})();

// "const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// // Replace with your own values
// const appId = "YOUR_APP_ID";
// const appCertificate = "YOUR_APP_CERTIFICATE";
// const channelName = "testChannel";
// const uid = 12345; // Can be user ID or 0
// const role = RtcRole.PUBLISHER;

// // Expiration (30 days from now)
// const expirationInSeconds = 60 * 60 * 24 * 30; // 30 days
// const currentTimestamp = Math.floor(Date.now() / 1000);
// const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

// const token = RtcTokenBuilder.buildTokenWithUid(
//   appId, appCertificate, channelName, uid, role, privilegeExpiredTs
// );

// console.log("Your Agora Token:", token);
// "

// Replace with your MQTT broker IP and port
// const droneSN = '1581F5FJD238900D79WS';
// const mqttBrokerUrl = 'mqtt://192.168.1.54:1883';
// const mqttTopic = 'thing/product/1581F5FJD238900D79WS/osd';

// // Serve the static frontend files
// app.use(express.static(path.join(__dirname, 'public')));

// // Connect to the MQTT broker
// const mqttClient = mqtt.connect(mqttBrokerUrl);

// mqttClient.on('connect', () => {
//     console.log('Connected to MQTT broker!');
//     // Subscribe to the drone topic
//     mqttClient.subscribe(mqttTopic, (err) => {
//         if (!err) {
//             console.log(`Subscribed to topic: ${mqttTopic}`);
//         } else {
//             console.error('Subscription failed:', err);
//         }
//     });
// });

// mqttClient.on('error', (err) => {
//     console.error('MQTT error:', err);
// });

// // Listen for incoming MQTT messages
// mqttClient.on('message', (topic, message) => {
//     try {
//         const droneData = JSON.parse(message.toString());
//         // console.log('Received data from MQTT:', droneData);

//         // Emit the data to all connected web clients via Socket.IO
//         io.emit('droneDataUpdate', droneData, droneSN);

//     } catch (e) {
//         console.error('Failed to parse MQTT message:', e);
//     }
// });

// // Socket.IO connection handling
// io.on('connection', (socket) => {
//     console.log('A user connected to the web server');

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//     });
// });

// Detection endpoint for YOLO server
app.post("/detection", (req, res) => {
  const { object_type, confidence, track_id, timestamp } = req.body;

  console.log(
    `🔍 New Detection: ${object_type} (ID: ${track_id}, Confidence: ${confidence})`
  );

  // Emit detection to all connected web clients via Socket.IO
  io.emit("newDetection", {
    object_type,
    confidence,
    track_id,
    timestamp,
  });

  res.status(200).json({ status: "success", message: "Detection received" });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(
    `Detection endpoint available at http://localhost:${PORT}/detection`
  );
});

// A more effective approach
const droneSNs = [
  "1581F5FJD238900D79WS",
  "1581F6GKB23B4004008E",
  "1581F5FKC249B00DNL4D",
];
const mqttBrokerUrl = "mqtt://192.168.1.54:1883";

// Connect to the MQTT broker and configure Socket.IO listeners once
const mqttClient = mqtt.connect(mqttBrokerUrl);

// Socket.IO connection handling should be set up once
io.on("connection", (socket) => {
  console.log("A user connected to the web server");
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker!");

  // Subscribe to all drone topics in a single loop
  droneSNs.forEach((sn) => {
    const topic = `thing/product/${sn}/osd`;
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        console.error(`Subscription failed for topic ${topic}:`, err);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  });
});

// Use a single, centralized message handler for all topics
// Use a single, centralized message handler for all topics
mqttClient.on("message", (topic, message) => {
  try {
    // console.log(JSON.parse(message));
    // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

    const droneData = JSON.parse(message.toString());
    // console.log("drone datas", droneData)

    // Extract the drone SN from the topic dynamically
    const sn = topic.split("/")[2];

    // 🚨 CRITICAL FIX: Emit using a single, generic event name 'droneDataUpdate'
    // and pass the SN as an argument.
    io.emit("droneDataUpdate", droneData, sn);
  } catch (e) {
    console.error("Failed to parse MQTT message:", e);
  }
});
// A single error handler is all that's needed
mqttClient.on("error", (err) => {
  console.error("MQTT error:", err);
});

//  for AI detection
