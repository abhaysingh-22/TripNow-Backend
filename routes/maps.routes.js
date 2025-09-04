import express from "express";
import { Router } from "express";
import { query } from "express-validator";
import mapsController from "../controllers/maps.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ CORRECT - Put validations in array, middleware in correct order
router.get(
  "/geocode",
  [query("address").isString().notEmpty().withMessage("Address is required")],
  authUser,
  mapsController.geocode
);

// ✅ CORRECT - All validations in array, then middleware, then handler
router.get(
  "/distance-time",
  [
    query("origin").isString().notEmpty().withMessage("Origin is required"),
    query("destination")
      .isString()
      .notEmpty()
      .withMessage("Destination is required"),
  ],
  authUser,
  mapsController.getDistanceTime
);

// ✅ CORRECT - Proper structure
router.get(
  "/suggestions",
  [query("input").isString().notEmpty().withMessage("Input is required")],
  authUser,
  mapsController.getSuggestions
);

// Remove or fix the commented section if it's causing issues
// router.get("/test-geocoding", async (req, res) => {
//   // ... complete this route properly if needed
// });

export default router;
