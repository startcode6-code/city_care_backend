import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/auth.routes";
import doctorRoutes from "./routes/doctor/doctor.routes"
import { errorHandler } from "./middleware/error-handler";
import serviceRoutes from "./routes/service/service.routes";
import youtubeVideoRoutes from "./routes/youtube-video/youtube-video.routes";
import blogRoutes from "./routes/blog/blog.routes"


const app = express();

// Middlewares
app.use(cors());
app.use(errorHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "City Care Hospital Backend is running",
  });
});

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(
      `[RESPONSE] ${req.method} ${req.originalUrl} - ${res.statusCode}`
    );
  });

  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", authRoutes)
app.use("/api/doctors", doctorRoutes)
app.use("/api/service", serviceRoutes)
app.use("/api/youtube-video", youtubeVideoRoutes)
app.use("/api/blog", blogRoutes)



app.use(errorHandler);


export default app; 