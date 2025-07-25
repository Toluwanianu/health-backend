const Appointment = require('../models/Appointment');
const Student = require('../models/Student');

// @desc    Student creates a new appointment
// @route   POST /api/appointments
// @access  Private (Student)
exports.createAppointment = async (req, res) => {
    const { reason, preferredDate } = req.body;
    try {
        const student = await Student.findById(req.student.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const appointment = new Appointment({
            student: req.student.id,
            reason,
            preferredDate
        });

        await appointment.save();
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Student gets their own appointments
// @route   GET /api/appointments
// @access  Private (Student)
exports.getStudentAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ student: req.student.id }).sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Admin gets all appointments
// @route   GET /api/appointments/admin
// @access  Private (Admin)
exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().populate('student', 'firstName lastName matricNumber').sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Admin updates an appointment status
// @route   PUT /api/appointments/admin/:id
// @access  Private (Admin)
exports.updateAppointmentStatus = async (req, res) => {
    const { status, adminNotes } = req.body;
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status || appointment.status;
        appointment.adminNotes = adminNotes || appointment.adminNotes;

        const updatedAppointment = await appointment.save();
        res.json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
