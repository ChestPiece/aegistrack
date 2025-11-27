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
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.clientUrl || "http://localhost:5173",
    credentials: true,
  },
});

// Initialize real-time services
initializeSocketIO(io);

// Start Server
httpServer.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`Socket.IO server initialized`);
});
