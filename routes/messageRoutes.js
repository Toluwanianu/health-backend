const express = require('express');
const router = express.Router();
const { protectAdmin, protectStudent } = require('../middleware/authMiddleware');
const {
  createMessage,
  getAllMessages,
  replyToMessage,
  getStudentMessages
} = require('../controllers/messageController');

router.route('/')
  .post(protectStudent, createMessage)
  .get(protectAdmin, getAllMessages);

router.get('/student', protectStudent, getStudentMessages);
router.post('/:id/reply', protectAdmin, replyToMessage);

module.exports = router;