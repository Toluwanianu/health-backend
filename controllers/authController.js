const Admin = require('../models/Admin');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in Node.js module for generating tokens
const sendEmail = require('../utils/sendEmail');

// POST /api/auth/admin/login
exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                _id: admin._id,
                username: admin.username,
                token: jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/auth/student/login
exports.loginStudent = async (req, res) => {
    // IMPORTANT: Make sure this function returns the student object as well as the token
    const { matricNumber, password } = req.body;
    try {
        const student = await Student.findOne({ matricNumber });
        if (student && (await bcrypt.compare(password, student.password))) {
            res.json({
                token: jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
                student: { // Return student details for localStorage
                    _id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    matricNumber: student.matricNumber,
                    email: student.email,
                    dateOfBirth: student.dateOfBirth,
                    gender: student.gender,
                    level: student.level,
                    faculty: student.faculty,
                    department: student.department,
                    phone: student.phone,
                    address: student.address,
                    medicalNumber: student.medicalNumber,
                    healthStatus: student.healthStatus,
                    genotype: student.genotype,
                    allergies: student.allergies,
                    medicalHistory: student.medicalHistory,
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- NEW: FORGOT PASSWORD CONTROLLER ---
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Find user by email (could be an admin or a student)
        let user = await Student.findOne({ email }) || await Admin.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }

        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the OTP and set it on the user model
        user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

        await user.save();

        // Send the OTP to the user's email
        const message = `
            <h1>Password Reset Request</h1>
            <p>You are receiving this email because you (or someone else) have requested the reset of a password.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h2 style="font-size: 24px; font-weight: bold;">${otp}</h2>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset OTP',
            html: message
        });

        res.status(200).json({ message: 'An OTP has been sent to your email.' });

    } catch (error) {
        console.error(error);
        // In case of error, clear the token fields to allow retries
        let user = await Student.findOne({ email }) || await Admin.findOne({ email });
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
        }
        res.status(500).json({ message: 'Error sending email.' });
    }
};


// --- NEW: RESET PASSWORD CONTROLLER ---
// POST /api/auth/reset-password/:token (we'll use the body for the token/OTP)
exports.resetPassword = async (req, res) => {
    const { otp, email, password } = req.body;

    try {
        // Hash the incoming OTP to match the one in the database
        const resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');

        // Find the user by email and the hashed token, and check if the token is still valid
        let user = await Student.findOne({
            email,
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        }) || await Admin.findOne({
            email,
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Set the new password
        user.password = password;
        // Clear the reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};
