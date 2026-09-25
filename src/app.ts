import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/auth.routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

// Middlewares
app.use(cors());
app.use(errorHandler);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "City Care Hospital Backend is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);

export default app;