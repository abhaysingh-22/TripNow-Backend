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
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://dt092cz3-5173.inc1.devtunnels.ms",
    ],
    credentials: true,
  })
);

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

app.use("/api/users", userRoutes);
app.use("/api/captains", captainRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
