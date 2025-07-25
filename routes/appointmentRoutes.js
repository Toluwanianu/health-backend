const express = require('express');
const router = express.Router();
const { protectAdmin, protectStudent } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  getStudentAppointments
} = require('../controllers/appointmentController');

// --- Student Routes ---
// Students can create an appointment and get their own appointments
router.route('/')
    .post(protectStudent, createAppointment)
    .get(protectStudent, getStudentAppointments);

// --- Admin Routes ---
// Admins can get all appointments and update a specific one
router.route('/admin').get(protectAdmin, getAllAppointments);
router.route('/admin/:id').put(protectAdmin, updateAppointmentStatus);

module.exports = router;
