import { Router } from "express";
import {
  registerCaptain,
  loginCaptain,
  getCaptainProfile,
  logoutCaptain,
  getCaptainStats,
} from "../controllers/captain.controller.js";
const router = Router();
import { body } from "express-validator";
import { authCaptain } from "../middlewares/auth.middleware.js";

router.post(
  "/register",
  [
    body("fullName.firstName").notEmpty().withMessage("First name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("vehicle.color").notEmpty().withMessage("Vehicle color is required"),
    body("vehicle.numberPlate")
      .notEmpty()
      .withMessage("Vehicle number plate is required"),
    body("vehicle.capacity")
      .isNumeric()
      .withMessage("Vehicle capacity must be a number"),
    body("vehicle.typeofVehicle")
      .notEmpty()
      .withMessage("Vehicle type is required"),
  ],
  registerCaptain
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  loginCaptain
);

router.get("/profile", authCaptain, getCaptainProfile);

router.get("/logout", authCaptain, logoutCaptain);

router.get("/stats", authCaptain, getCaptainStats);

export default router;
