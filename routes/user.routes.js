import { Router } from "express";
import { body } from "express-validator"; // Importing express-validator for request validation it helps in validating the request body for user registration and login
import {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
} from "../controllers/user.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  [
    body("fullName.firstName").notEmpty().withMessage("First name is required"),
    body("fullName.lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  loginUser
);

router.get("/profile", authUser, getUserProfile);

router.get("/logout", authUser, logoutUser);

export default router;
