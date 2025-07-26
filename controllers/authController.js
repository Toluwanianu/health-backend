const Admin = require('../models/Admin');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// POST /api/auth/admin/login
exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the admin by their username
        const admin = await Admin.findOne({ username });

        // If no admin is found, or if the password doesn't match, send error
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If login is successful, create and send the token
        res.json({
            _id: admin._id,
            username: admin.username,
            token: jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/auth/student/login
exports.loginStudent = async (req, res) => {
    const { matricNumber, password } = req.body;
    try {
        const student = await Student.findOne({ matricNumber });
        if (student && (await bcrypt.compare(password, student.password))) {
            res.json({
                token: jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
                student: {
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

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        let user = await Student.findOne({ email }) || await Admin.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const message = `
            <h1>Password Reset Request</h1>
            <p>Your One-Time Password (OTP) is:</p>
            <h2 style="font-size: 24px; font-weight: bold;">${otp}</h2>
            <p>This OTP is valid for 10 minutes.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset OTP',
            html: message
        });

        res.status(200).json({ message: 'An OTP has been sent to your email.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending email.' });
    }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    const { otp, email, password } = req.body;
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');

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

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};
