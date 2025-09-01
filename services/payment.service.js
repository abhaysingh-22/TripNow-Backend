import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/payment.model.js";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error("❌ Razorpay API keys not configured");
}

const razorpay = razorpayKeyId && razorpayKeySecret ? 
  new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret }) : null;

export const createRazorpayOrder = async (amount, rideId) => {
  try {
    if (!amount || amount <= 0) throw new Error("Invalid amount");
    if (!rideId) throw new Error("Invalid ride ID");
    if (!razorpay) throw new Error("Razorpay not configured");

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `ride_${rideId}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    if (!order?.id) throw new Error("Order creation failed");
    
    console.log("✅ Razorpay order created:", order.id);
    return order;
  } catch (error) {
    console.error("❌ Razorpay order error:", error.message);
    throw new Error(`Payment failed: ${error.message}`);
  }
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    if (!razorpayKeySecret) return false;
    
    const expected = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    
    return expected === signature;
  } catch (error) {
    console.error("❌ Signature verification error:", error.message);
    return false;
  }
};

export const createPayment = async (paymentData) => {
  try {
    const payment = await Payment.create(paymentData);
    return payment;
  } catch (error) {
    throw new Error(`Payment creation failed: ${error.message}`);
  }
};

export const updatePaymentStatus = async (paymentId, updateData) => {
  try {
    const payment = await Payment.findByIdAndUpdate(paymentId, updateData, { new: true });
    if (!payment) throw new Error("Payment not found");
    return payment;
  } catch (error) {
    throw new Error(`Payment update failed: ${error.message}`);
  }
};

export default { createRazorpayOrder, verifyRazorpaySignature, createPayment, updatePaymentStatus };
