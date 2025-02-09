const { totp } = require('otplib');
const User = require('../models/user');
const {Mailer} = require('../utils/mailer');

// Configure OTP generation
totp.options = {
  step: 300, // OTP valid for 5 minutes
  digits: 6,
};

// Helper Function for Sending Error Response
const handleError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ status: 'error', message });
};

// Send OTP Function
const sendOtp = async (req, res) => {
  try {
    const { email, mode } = req.body;
    
    if (mode == "change password" || mode == "forget password") {
        const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }



    if (!email) {
      return handleError(res, 'Email is required');
    }

    // Check if user exists
    

   

    // Generate OTP using email as the secret
    const otp = totp.generate(email);
    console.log(`Generated OTP: ${otp} for email: ${email}`);

    // Save OTP and expiry to the user document
   


    // Send the OTP via email
    await Mailer(email, `Your OTP is ${otp}`, 'OTP Verification');
    return res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    handleError(res, 'Error sending OTP', 500);
  }
};

// Verify OTP Function
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return handleError(res, 'Email and OTP are required');
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return handleError(res, 'Invalid OTP or user not found');
    }

    // Check if the OTP has expired
    if (Date.now() > user.otpExpiresAt) {
      return handleError(res, 'OTP expired');
    }

    // Verify the OTP using the same secret (email)
    if (totp.check(otp, email)) {
      // Clear OTP after successful verification
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();

      return res.status(200).json({ status: 'success', message: 'OTP verified successfully' });
    } else {
      return handleError(res, 'Invalid OTP');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    handleError(res, 'Error verifying OTP', 500);
  }
};

// Exporting controller functions
module.exports = {
  sendOtp,
  verifyOtp,
};
