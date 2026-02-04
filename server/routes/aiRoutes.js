const express = require('express');
const upload = require('../middleware/upload');
const {
  handleTextChat,
  handleVoiceChat,
  handleImageChat,
  getChatHistory,
  handleTextToSpeech
} = require('../controllers/aiController');

const router = express.Router();

// Text chat endpoint
router.post('/chat', handleTextChat);

// Voice chat endpoint
router.post('/voice', handleVoiceChat);

// Image chat endpoint
router.post('/image', upload.single('image'), handleImageChat);

// Get chat history
router.get('/history/:sessionId', getChatHistory);

module.exports = router;