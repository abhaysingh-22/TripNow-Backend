import Ride from "../models/ride.model.js";
import mapsService from "./maps.service.js";
import crypto from "crypto";

async function getFare(pickupLocation, dropoffLocation, vehicleType = "car") {
  if (!pickupLocation || !dropoffLocation) {
    throw new Error("Both pickup and dropoff locations are required.");
  }

  try {
    const { distance, duration } = await mapsService.getDistanceTime(
      pickupLocation,
      dropoffLocation
    );
    if (!distance || !duration) {
      throw new Error("Could not retrieve distance or duration.");
    }
    const fare = calculateFare(distance, duration, vehicleType);
    return fare;
  } catch (error) {
    throw new Error(`Failed to calculate fare: ${error.message}`);
  }
}

function calculateFare(distance, duration, vehicleType = "car") {
  const rates = {
    auto: {
      baseFare: 25,
      perKm: 12,
      perMinute: 2,
    },
    car: {
      baseFare: 50,
      perKm: 15,
      perMinute: 3,
    },
    motorcycle: {
      baseFare: 20,
      perKm: 8,
      perMinute: 1.5,
    },
    bike: {
      baseFare: 20,
      perKm: 8,
      perMinute: 1.5,
    },
  };

  const vehicleRate = rates[(vehicleType || "car").toLowerCase()] || rates.car;

  // Convert distance and duration to numbers
  const distanceInKm =
    typeof distance === "number" ? distance : parseFloat(distance) || 0;
  const durationInMinutes =
    typeof duration === "number" ? duration : parseFloat(duration) || 0;

  console.log("Fare calculation inputs:", {
    vehicleType,
    distanceInKm,
    durationInMinutes,
    rates: vehicleRate,
  });

  const fare =
    vehicleRate.baseFare +
    distanceInKm * vehicleRate.perKm +
    durationInMinutes * vehicleRate.perMinute;

  const finalFare = Math.round(fare * 100) / 100; // Round to 2 decimal places

  console.log("Calculated fare:", finalFare);

  return finalFare;
}

// Get fare with distance and duration details
async function getFareWithDetails(
  pickupLocation,
  dropoffLocation,
  vehicleType = "car"
) {
  try {
    const trip = await mapsService.getDistanceTime(
      pickupLocation,
      dropoffLocation
    );
    const fare = calculateFare(trip.distance, trip.duration, vehicleType);

    return {
      fare,
      distance: trip.distance, // Already a number
      duration: Math.round(Number(trip.duration)), // Round duration to whole number
      distanceText: trip.distanceText, // For display purposes
      durationText: trip.durationText, // For display purposes
    };
  } catch (error) {
    throw new Error(`Failed to get fare with details: ${error.message}`);
  }
}

// Generate OTP for ride
function generateOTP() {
  const otp = crypto.randomInt(1000, 9999).toString();
  return otp; // Return just the OTP, no hashing needed for display
}

// Create a new ride
const createRide = async (rideData) => {
  const {
    userId,
    pickupLocation,
    dropoffLocation,
    vehicleType,
    fare,
    paymentMethod,
  } = rideData;

  // Validate required fields
  if (!userId || !pickupLocation || !dropoffLocation) {
    throw new Error(
      "User ID, pickup location, and dropoff location are required."
    );
  }

  try {
    // Generate OTP for the ride
    const otp = generateOTP();

    // Calculate fare if not provided
    let rideFare = fare;
    if (!rideFare) {
      rideFare = await getFare(pickupLocation, dropoffLocation, vehicleType);
    }

    // Create new ride object
    const newRide = new Ride({
      userId,
      pickupLocation,
      dropoffLocation,
      vehicleType: vehicleType || "car",
      fare: rideFare,
      paymentMethod: paymentMethod || "cash",
      status: "pending",
      otp: otp,
    });

    // Save ride to database
    const savedRide = await newRide.save();

    console.log("✅ Ride created successfully:", {
      rideId: savedRide._id,
      fare: savedRide.fare,
      otp: otp, // Log OTP for debugging
    });

    return savedRide;
  } catch (error) {
    console.error("❌ Failed to create ride:", error.message);
    throw new Error(`Failed to create ride: ${error.message}`);
  }
};

// Get trip details (alias for getFareWithDetails)
async function getTrip(pickupLocation, dropoffLocation, vehicleType = "car") {
  return await getFareWithDetails(pickupLocation, dropoffLocation, vehicleType);
}

// Export all functions
export default {
  createRide,
  generateOTP,
  getFare,
  calculateFare,
  getFareWithDetails,
  getTrip,
};
