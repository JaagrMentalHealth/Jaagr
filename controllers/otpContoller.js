const { generateOTP } = require("../utils/otp");
const { Mailer } = require("../utils/mailer");
const User = require("../models/User"); // Assuming User model is defined



// Generate and Send OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    const text = `Your OTP is ${otp}. It is valid for 10 minutes.`;
    const mailSent = await Mailer(email, text, "Your OTP Code");

    if (mailSent) {
      res.status(200).json({ message: "OTP sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    console.error("Error in sending OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (user.otp !== token) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null; // Clear OTP after successful verification
    user.otpExpiresAt = null;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { sendOTP, verifyOTP };
