import express from "express";
import cors from "cors";
import morgan from "morgan";
import { routes } from "./routes";
import { config } from "./config";

const app = express();

// CORS Configuration - only allow specific origins
const allowedOrigins = [
  config.frontendUrl || "http://localhost:8080",
  config.clientUrl || "http://localhost:5173",
  "https://aegistrack-chi.vercel.app",
  "https://aegistrack.onrender.com",
  "https://aegistrack-frontend.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// Routes
app.use("/api", routes);

// Base route
app.get("/", (req, res) => {
  res.send("AegisTrack API is running");
});

export { app };
