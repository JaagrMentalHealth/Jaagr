const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpContoller");

// Route to send OTP
router.post("/send-otp", otpController.sendOTP);

// Route to verify OTP
router.post("/verify-otp", otpController.verifyOTP);

module.exports = router;
