const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudentsCSV,
  downloadStudentRecordPDF,
  getDashboardStats
} = require('../controllers/studentController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.route('/')
  .post(protectAdmin, createStudent)
  .get(protectAdmin, getAllStudents);

router.get('/stats', protectAdmin, getDashboardStats);
router.post('/import', protectAdmin, upload.single('file'), importStudentsCSV);

router.route('/:id')
  .get(protectAdmin, getStudentById)
  .put(protectAdmin, updateStudent)
  .delete(protectAdmin, deleteStudent);

router.get('/:id/pdf', protectAdmin, downloadStudentRecordPDF);

module.exports = router;