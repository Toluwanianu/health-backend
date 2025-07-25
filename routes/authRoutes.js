const express = require('express');
const router = express.Router();
const { 
    loginAdmin, 
    loginStudent, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');

// Existing login routes
router.post('/admin/login', loginAdmin);
router.post('/student/login', loginStudent);

// Password Reset Routes
// Route to handle the initial "forgot password" request
router.post('/forgot-password', forgotPassword);

// Route to handle the password submission with the reset token/OTP
router.post('/reset-password', resetPassword);

module.exports = router;
