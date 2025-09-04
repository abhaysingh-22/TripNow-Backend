import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
import connectToDB from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import captainRoutes from "./routes/captain.routes.js";
import mapsRoutes from "./routes/maps.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

// Connect to database (non-blocking)
connectToDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err.message);
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        "http://localhost:5173",
        "https://trip-now-phi.vercel.app",
      ];

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check for devtunnels pattern
      try {
        const url = new URL(origin);
        if (/\.devtunnels\.ms$/.test(url.hostname)) {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid URL, reject
      }

      callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Add preflight handling
app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // urlencoded is used to parse form data this is basically a middleware
app.use(cookieParser()); // Middleware to parse cookies

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Query params:", req.query);
  console.log("Body:", req.body);
  console.log("---");
  next();
});

// Replace your current route mounting (lines 40-44) with this:
app.use("/api/users", userRoutes);
app.use("/api/captains", captainRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
