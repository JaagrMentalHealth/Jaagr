const express = require('express');
const router = express.Router();
// const otpController = require('../controllers/otpController');
const authMiddleware=require("../middleware/auth")
// Route to send OTP
router.post('/test',authMiddleware.protect, (req,res)=>{
    res.status(201).json(
        req.user
    )
});

// Route to verify OTP


module.exports = router;