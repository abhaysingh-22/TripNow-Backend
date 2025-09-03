import { Server } from "socket.io";
import User from "./models/user.model.js";
import Captain from "./models/captain.model.js";
import mongoose from "mongoose";

let io = null;

function initialiseSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    socket.on("join", async (data) => {
      const { userId, role } = data;

      try {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
          socket.emit("error", { message: "Invalid user ID format" });
          return;
        }

        if (role === "user") {
          const user = await User.findByIdAndUpdate(
            userId,
            { socketId: socket.id },
            { new: true }
          );

          if (!user) {
            socket.emit("error", { message: "User not found" });
            return;
          }

          socket.join(`user_${userId}`);
          socket.emit("joined", { role: "user", userId });
        } else if (role === "captain") {
          const captain = await Captain.findByIdAndUpdate(
            userId,
            { socketId: socket.id },
            { new: true }
          );

          if (!captain) {
            socket.emit("error", { message: "Captain not found" });
            return;
          }

          socket.join(`captain_${userId}`);
          socket.emit("joined", { role: "captain", userId });
        } else {
          socket.emit("error", {
            message: "Invalid role. Must be 'user' or 'captain'",
          });
        }
      } catch (err) {
        console.error("Error in join event:", err);
        socket.emit("error", { message: "Failed to join. Please try again." });
      }
    });

    socket.on("message", (data) => {
      io.emit("message", data);
    });

    socket.on("update-location-captain", async ({ userId, role, location }) => {
      try {
        if (
          !userId ||
          !mongoose.Types.ObjectId.isValid(userId) ||
          !location?.latitude ||
          !location?.longitude
        ) {
          return;
        }

        if (role === "captain") {
          await Captain.findByIdAndUpdate(
            userId,
            {
              location: {
                latitude: parseFloat(location.latitude),
                longitude: parseFloat(location.longitude),
              },
            },
            { new: true }
          );
        }
      } catch (err) {
        console.error("Error updating captain location:", err);
      }
    });

    socket.on("user-location-update", (data) => {
      // Handle user location updates if needed
    });

    socket.on("captain-location-update", (data) => {
      if (data.userSocketId) {
        io.to(data.userSocketId).emit("captain-location-update", {
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

    socket.on("disconnect", async () => {
      try {
        await Promise.all([
          User.updateOne({ socketId: socket.id }, { $unset: { socketId: 1 } }),
          Captain.updateOne(
            { socketId: socket.id },
            { $unset: { socketId: 1 } }
          ),
        ]);
      } catch (err) {
        console.error("Error clearing socketId:", err);
      }
    });
  });
}

function sendRideUpdateToUser(ride) {
  const { userId, _id: rideId } = ride;
  const newDistance = calculateNewDistance(ride);
  const newDuration = calculateNewDuration(ride);

  io.to(`user_${userId}`).emit("ride-update", {
    rideId,
    distance: newDistance,
    duration: newDuration,
  });
}

function sendMessageToSocketId(socketId, event, message) {
  if (!io || !socketId) {
    return false;
  }

  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit(event, message);
    return true;
  }

  return false;
}

function getSocketStatus() {
  if (!io) return { connected: false, totalSockets: 0 };

  return {
    connected: true,
    totalSockets: io.sockets.sockets.size,
    socketIds: Array.from(io.sockets.sockets.keys()),
  };
}

export {
  initialiseSocket,
  sendMessageToSocketId,
  sendRideUpdateToUser,
  getSocketStatus,
};
