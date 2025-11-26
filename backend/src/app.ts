import express from "express";
import cors from "cors";
import morgan from "morgan";
import { routes } from "./routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Base route
app.get("/", (req, res) => {
  res.send("AegisTrack API is running");
});

export { app };
