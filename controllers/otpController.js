const { totp } = require("otplib");
const User = require("../models/User");
const { Mailer } = require("../utils/mailer");

// Configure OTP generation
totp.options = {
  step: 300, // OTP valid for 5 minutes
  digits: 6,
};

// Helper Function for Sending Error Response
const handleError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ status: "error", message });
};

// Send OTP Function
const sendOtp = async (req, res) => {
  try {
    const { email, mode } = req.body;
    const user = await User.findOne({ email });

    if (mode == "change password" || mode == "forget password") {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      if (user) return res.status(403).json({ message: "User Already Exists" });
    }

    if (!email) {
      return handleError(res, "Email is required");
    }

    const otp = totp.generate(email);
    console.log(`Generated OTP: ${otp} for email: ${email}`);

    await Mailer(email, `Your OTP is ${otp}`, "OTP Verification");
    return res
      .status(200)
      .json({ status: "success", message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    handleError(res, "Error sending OTP", 500);
  }
};

// Verify OTP Function
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return handleError(res, "Email and OTP are required");
    }

    if (totp.check(otp, email)) {
      return res
        .status(200)
        .json({ status: "success", message: "OTP verified successfully" });
    } else {
      return handleError(res, "Invalid OTP");
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    handleError(res, "Error verifying OTP", 500);
  }
};

// Exporting controller functions
module.exports = {
  sendOtp,
  verifyOtp,
};
