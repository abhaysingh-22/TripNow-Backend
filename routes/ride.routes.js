import express from "express";
import { Router } from "express";
import { body, query } from "express-validator";
import * as rideController from "../controllers/ride.controller.js";
import { authUser, authCaptain } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  [
    body("pickup")
      .isString()
      .notEmpty()
      .withMessage("Pickup location is required"),
    body("dropoff")
      .isString()
      .notEmpty()
      .withMessage("Dropoff location is required"),
    body("vehicleType")
      .isString()
      .notEmpty()
      .withMessage("Vehicle type is required"),
  ],
  authUser,
  rideController.createRide
);

router.get(
  "/fare",
  [
    query("pickup")
      .isString()
      .notEmpty()
      .withMessage("Pickup location is required"),
    query("dropoff")
      .isString()
      .notEmpty()
      .withMessage("Dropoff location is required"),
    query("vehicleType")
      .optional()
      .isString()
      .withMessage("Vehicle type must be a string"),
  ],
  authUser,
  rideController.getFare
);

router.post(
  "/confirm",
  [
    body("pickup")
      .isString()
      .notEmpty()
      .withMessage("Pickup location is required"),
    body("dropoff")
      .isString()
      .notEmpty()
      .withMessage("Dropoff location is required"),
    body("vehicleType")
      .isString()
      .notEmpty()
      .withMessage("Vehicle type is required"),
    body("paymentMethod")
      .isString()
      .notEmpty()
      .withMessage("Payment method is required"),
  ],
  authUser,
  rideController.confirmRide
);

router.post(
  "/accept",
  [
    body("rideId")
      .notEmpty()
      .withMessage("Ride ID is required")
      .isLength({ min: 24, max: 24 })
      .withMessage("Invalid ride ID format"),
  ],
  authCaptain,
  rideController.acceptRide
);

router.post(
  "/start",
  [
    body("rideId").isMongoId().withMessage("Valid ride ID is required"),
    body("otp")
      .isString()
      .isLength({ min: 4, max: 4 })
      .withMessage("OTP must be 4 digits"),
  ],
  authCaptain,
  rideController.startRide
);

// ✅ CORRECT - Put all validations in the array
router.post(
  "/complete",
  [
    body("rideId").isMongoId().withMessage("Valid ride ID is required"),
    body("fare").isNumeric().withMessage("Fare must be a number"),
    body("distance").isNumeric().withMessage("Distance must be a number"),
    body("duration").isNumeric().withMessage("Duration must be a number"),
  ],
  authCaptain,
  rideController.completeRide
);

export default router;
