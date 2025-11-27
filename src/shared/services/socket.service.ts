import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    // Get base URL without /api path for Socket.IO connection
    let serverUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    // Remove /api path if present since Socket.IO connects to root
    serverUrl = serverUrl.replace("/api", "");

    console.log("Connecting to Socket.IO server:", serverUrl);

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.userId = userId;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      // Authenticate with server
      if (this.userId) {
        this.socket?.emit("authenticate", this.userId);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
