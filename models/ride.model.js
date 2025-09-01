import mongoose from "mongoose";
import { Schema } from "mongoose";

const rideSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  captainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Captain",
  },
  pickupLocation: {
    type: String,
    required: true,
  },
  dropoffLocation: {
    type: String,
    required: true,
  },
  fare: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  duration: {
    type: Number,
  },
  distance: {
    type: Number,
  },
  completedAt: {
    type: Date,
  },
  paymentId: {
    type: String,
  },
  orderId: {
    type: String,
  },
  signature: {
    type: String,
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "upi"],
    default: "cash",
  },
  otp: {
    type: String,
    required: true,
    select: false, // Exclude OTP from queries by default
  },
});

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
