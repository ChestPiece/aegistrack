import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app";
import { config, connectDatabase } from "./config";
import { initializeSocketIO } from "./services/realtime.service";

// Connect to Database
connectDatabase();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const allowedOrigins = [
  config.clientUrl || "http://localhost:5173",
  config.frontendUrl || "http://localhost:8080","https://aegistrack-chi.vercel.app/",
  "https://aegistrack.onrender.com", // Fallback for production
  "https://aegistrack-frontend.onrender.com", // Fallback for production
];

console.log("Socket.IO allowed origins:", allowedOrigins);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Initialize real-time services
initializeSocketIO(io);

// Start Server
httpServer.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`Socket.IO server initialized`);
});
