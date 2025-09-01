import { validationResult } from "express-validator";
import paymentService from "../services/payment.service.js";
import Ride from "../models/ride.model.js";
import Payment from "../models/payment.model.js";

const createPaymentOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, amount } = req.body;
  const userId = req.user._id;

  try {
    // Validate ride
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (ride.paymentMethod !== "upi") {
      return res.status(400).json({ error: "UPI payment required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Create Razorpay order
    const razorpayOrder = await paymentService.createRazorpayOrder(amount, rideId);

    // Create payment record
    const payment = await paymentService.createPayment({
      rideId,
      userId,
      captainId: ride.captainId,
      paymentMethod: "upi",
      amount,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Payment order error:", error.message);
    res.status(500).json({ 
      error: error.message || "Payment order failed",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

const verifyPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    // Verify signature
    const isValid = paymentService.verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Update payment
    const payment = await paymentService.updatePaymentStatus(paymentId, {
      razorpayPaymentId,
      razorpaySignature,
      status: "completed",
      completedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Payment verified",
      payment,
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error.message);
    res.status(500).json({ 
      error: error.message || "Verification failed",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

export default { createPaymentOrder, verifyPayment };
