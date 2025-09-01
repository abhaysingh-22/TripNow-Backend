import rideService from "../services/ride.service.js";
import mapsService from "../services/maps.service.js";
import { validationResult } from "express-validator";
import { sendMessageToSocketId } from "../socket.js";
import Captain from "../models/captain.model.js";
import Ride from "../models/ride.model.js";

const createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, dropoff, vehicleType } = req.body;

  try {
    const fare = await rideService.getFare(pickup, dropoff, vehicleType);
    const rideData = {
      userId: req.user._id,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      vehicleType,
      fare: typeof fare === "number" && !isNaN(fare) ? fare : 0,
      otp: "",
    };

    const newRide = await rideService.createRide(rideData);
    const populatedRide = await Ride.findById(newRide._id).populate({
      path: "userId",
      select: "fullName name email photo rating",
    });

    res.status(201).json(newRide);

    // Background processing for finding captains
    setImmediate(() =>
      notifyNearbyCapitains(
        pickup,
        dropoff,
        vehicleType,
        newRide,
        populatedRide
      )
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, dropoff, vehicleType } = req.query;

  try {
    const trip = await mapsService.getFareWithDetails(
      pickup,
      dropoff,
      vehicleType
    );

    return res.status(200).json({
      pickup,
      dropoff,
      vehicleType: vehicleType || "car",
      fare: trip.fare,
      distance: trip.distance,
      duration: trip.duration,
      distanceText: trip.distanceText,
      durationText: trip.durationText,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

const confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, dropoff, vehicleType, paymentMethod } = req.body;

  try {
    const fare = await rideService.getFare(pickup, dropoff, vehicleType);
    const rideData = {
      userId: req.user._id,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      vehicleType,
      paymentMethod,
      fare,
    };

    const newRide = await rideService.createRide(rideData);
    const populatedRide = await Ride.findById(newRide._id).populate({
      path: "userId",
      select: "fullName name email photo rating",
    });

    res.status(201).json({
      success: true,
      message: "Ride request sent to nearby drivers",
      ride: {
        _id: newRide._id,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        fare: fare,
        otp: newRide.otp,
        status: newRide.status,
        paymentMethod: paymentMethod,
      },
    });

    // Background processing for finding captains
    setImmediate(() =>
      notifyNearbyCapitains(
        pickup,
        dropoff,
        vehicleType,
        newRide,
        populatedRide,
        paymentMethod
      )
    );
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const acceptRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;
  const captainId = req.captain._id;

  try {
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { captainId: captainId, status: "accepted" },
      { new: true }
    ).populate("userId");

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Notify user that ride was accepted
    if (ride.userId.socketId) {
      sendMessageToSocketId(ride.userId.socketId, "ride-accepted", {
        rideId: ride._id,
        otp: ride.otp,
        captain: {
          _id: captainId,
          name: req.captain.fullName?.firstName || "Driver",
          photo:
            req.captain.photo ||
            "https://randomuser.me/api/portraits/lego/1.jpg",
          vehicle: req.captain.vehicle,
        },
        message: "Driver found! Your ride has been accepted.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ride accepted successfully",
      ride: {
        _id: ride._id,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        fare: ride.fare,
        status: ride.status,
        otp: ride.otp,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }

  const { rideId, otp } = req.body;
  const captainId = req.captain._id;

  try {
    const ride = await Ride.findById(rideId).select("+otp");

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride.captainId.toString() !== captainId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this ride" });
    }

    if (ride.status !== "accepted") {
      return res.status(400).json({
        error: `Ride is not in accepted status. Current status: ${ride.status}`,
      });
    }

    if (ride.otp !== otp) {
      return res
        .status(400)
        .json({ error: "Invalid OTP. Please check with passenger." });
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      { status: "in-progress" },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Ride started successfully",
      ride: updatedRide,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const completeRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, fare, distance, duration } = req.body;
  const captainId = req.captain._id;

  try {
    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        captainId: captainId,
        status: { $in: ["accepted", "in-progress"] },
      },
      {
        status: "completed",
        completedAt: new Date(),
        fare: fare,
        distance: distance,
        duration: duration,
      },
      { new: true }
    ).populate("userId");

    if (!ride) {
      return res.status(404).json({
        error: "Ride not found or you're not authorized to complete it",
      });
    }

    const updatedCaptain = await Captain.findByIdAndUpdate(
      captainId,
      {
        $inc: {
          totalRides: 1,
          totalEarnings: Number(fare),
          totalDistance: Number(distance),
        },
      },
      { new: true }
    );

    if (ride.userId && ride.userId.socketId) {
      const messageData = {
        rideId: ride._id,
        paymentMethod: ride.paymentMethod,
        amount: fare,
        message: "Your ride has been completed",
      };

      sendMessageToSocketId(
        ride.userId.socketId,
        "ride-completed",
        messageData
      );
    }

    res.status(200).json({
      success: true,
      message: "Ride completed successfully",
      ride: {
        _id: ride._id,
        status: ride.status,
        fare: ride.fare,
        distance: ride.distance,
        duration: ride.duration,
        completedAt: ride.completedAt,
        paymentMethod: ride.paymentMethod,
      },
      captain: {
        totalRides: updatedCaptain.totalRides,
        totalEarnings: updatedCaptain.totalEarnings,
        totalDistance: updatedCaptain.totalDistance,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Helper function for notifying nearby captains
async function notifyNearbyCapitains(
  pickup,
  dropoff,
  vehicleType,
  newRide,
  populatedRide,
  paymentMethod = null
) {
  try {
    const trip = await rideService.getFareWithDetails(
      pickup,
      dropoff,
      vehicleType
    );

    // Try to get pickup coordinates with fallback
    let pickupCoordinates;
    try {
      pickupCoordinates = await mapsService.getCoordinates(pickup);
    } catch (geocodingError) {
      console.error("Geocoding failed for pickup:", pickup);
      // Use fallback coordinates (Delhi center)
      pickupCoordinates = {
        latitude: 28.7041,
        longitude: 77.1025,
      };
    }

    const captainInRadius = await mapsService.getCaptainsInRadius(
      pickupCoordinates.latitude,
      pickupCoordinates.longitude,
      10 // 10km radius
    );

    if (captainInRadius.length === 0) {
      console.warn(
        "No captains found in radius. Ride request may not be delivered."
      );
      return;
    }

    const userName = getUserName(populatedRide.userId);

    captainInRadius.forEach((captain) => {
      if (captain.socketId) {
        const rideRequestData = {
          type: "newRide",
          ride: {
            _id: newRide._id,
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            fare: Number(newRide.fare) || 0,
            pickup: {
              address: pickup,
              time: "2 min away",
            },
            destination: {
              address: dropoff,
              time: `${Math.round(Number(trip.duration)) || 15} min`,
            },
            distance: Number(trip.distance) || 5.2,
            duration: Number(trip.duration) || 15,
            amount: Number(newRide.fare) || 0,
            paymentMethod: paymentMethod,
            pickupCoordinates,
            captainId: captain._id,
          },
          user: {
            _id: populatedRide.userId._id,
            name: userName,
            rating: populatedRide.userId.rating || 4.5,
            photo:
              populatedRide.userId.photo ||
              "https://randomuser.me/api/portraits/lego/1.jpg",
          },
        };

        sendMessageToSocketId(
          captain.socketId,
          "ride-request",
          rideRequestData
        );
      }
    });
  } catch (error) {
    console.error("Background processing error:", error);
  }
}

// Helper function to get user name
function getUserName(user) {
  if (!user) return "Unknown User";

  if (user.fullName) {
    return `${user.fullName.firstName} ${user.fullName.lastName || ""}`.trim();
  }

  return user.name || user.email || "Unknown User";
}

export default {
  createRide,
  getFare,
  confirmRide,
  acceptRide,
  startRide,
  completeRide,
};
