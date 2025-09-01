import { Router } from "express";
import { body } from "express-validator";
import paymentController from "../controllers/payment.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create-order",
  [
    body("rideId").isMongoId().withMessage("Valid ride ID is required"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
  ],
  authUser,
  paymentController.createPaymentOrder
);

router.post(
  "/verify",
  [
    body("paymentId").isMongoId().withMessage("Valid payment ID is required"),
    body("razorpayOrderId")
      .isString()
      .notEmpty()
      .withMessage("Razorpay order ID is required"),
    body("razorpayPaymentId")
      .isString()
      .notEmpty()
      .withMessage("Razorpay payment ID is required"),
    body("razorpaySignature")
      .isString()
      .notEmpty()
      .withMessage("Razorpay Signature is required"),
  ],
  authUser,
  paymentController.verifyPayment
);

export default router;
