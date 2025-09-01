import mongoose from "mongoose";
import { createServer } from "http";
import app from "./app.js";
import { initialiseSocket } from "./socket.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const server = createServer(app);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    initialiseSocket(server); // <-- Only start socket after DB is ready
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Handle server errors
server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  switch (error.code) {
    case "EADDRINUSE":
      console.error(`Port ${PORT} is already in use`);
      console.log("Please kill the process or use a different port");
      process.exit(1);
      break;
    default:
      throw error;
  }
});

process.on("SIGINT", () => {
  console.log("Shutting down server...");
  process.exit();
});
