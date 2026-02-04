require('dotenv').config();
const Groq = require('groq-sdk');
const Chat = require('../models/Chat');

if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate session ID
const generateSessionId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Text chat handler
const handleTextChat = async (req, res) => {
  try {
    const { message, sessionId, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const currentSessionId = sessionId || generateSessionId();

    // Get or create chat session
    let chat = await Chat.findOne({ sessionId: currentSessionId });
    if (!chat) {
      chat = new Chat({ sessionId: currentSessionId, messages: [] });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      type: 'text'
    });

    // Prepare messages for Groq API
    const messages = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system message for language if specified
    if (language) {
      messages.unshift({
        role: 'system',
        content: `You are a helpful assistant. You must ALWAYS respond in ${language}. If the user speaks in a different language, understand their intent but reply strictly in ${language}.`
      });
    }

    // Get AI response from Groq
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Add AI response
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      type: 'text'
    });

    await chat.save();

    res.json({
      response: aiResponse,
      sessionId: currentSessionId,
      type: 'text'
    });

  } catch (error) {
    console.error('Text chat error:', error);
    res.status(500).json({
      error: 'Failed to process text chat',
      message: error.message
    });
  }
};

// Voice chat handler
const handleVoiceChat = async (req, res) => {
  try {
    const { message, sessionId, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Voice message is required' });
    }

    const currentSessionId = sessionId || generateSessionId();

    // Get or create chat session
    let chat = await Chat.findOne({ sessionId: currentSessionId });
    if (!chat) {
      chat = new Chat({ sessionId: currentSessionId, messages: [] });
    }

    // Add user voice message
    chat.messages.push({
      role: 'user',
      content: message,
      type: 'voice'
    });

    // Prepare messages for Groq API
    const messages = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system message for language if specified
    if (language) {
      messages.unshift({
        role: 'system',
        content: `You are a helpful assistant. You must ALWAYS respond in ${language}. If the user speaks in a different language, understand their intent but reply strictly in ${language}.`
      });
    }

    // Get AI response from Groq
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Add AI response
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      type: 'voice'
    });

    await chat.save();

    res.json({
      response: aiResponse,
      sessionId: currentSessionId,
      type: 'voice'
    });

  } catch (error) {
    console.error('Voice chat error:', error);
    res.status(500).json({
      error: 'Failed to process voice chat',
      message: error.message
    });
  }
};

// Image chat handler
const handleImageChat = async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    const image = req.file;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const currentSessionId = sessionId || generateSessionId();

    const base64Image = image.buffer.toString('base64');
    const imageDataUrl = `data:${image.mimetype};base64,${base64Image}`;

    // Get or create chat session
    let chat = await Chat.findOne({ sessionId: currentSessionId });
    if (!chat) {
      chat = new Chat({ sessionId: currentSessionId, messages: [] });
    }

    // Add user message with image
    chat.messages.push({
      role: 'user',
      content: question,
      type: 'image',
      imageUrl: imageDataUrl
    });

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Please analyze this image and answer the following question: ${question}`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
              detail: 'high'
            }
          }
        ]
      }
    ];

    // Get AI response from Groq with vision model
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not analyze the image.';

    // Add AI response
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      type: 'image'
    });

    await chat.save();

    res.json({
      response: aiResponse,
      sessionId: currentSessionId,
      type: 'image',
      imageUrl: imageDataUrl
    });

  } catch (error) {
    console.error('Image chat error:', error);
    res.status(500).json({
      error: 'Failed to process image chat',
      message: error.message
    });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chat = await Chat.findOne({ sessionId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      sessionId: chat.sessionId,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ 
      error: 'Failed to get chat history',
      message: error.message 
    });
  }
};

module.exports = {
  handleTextChat,
  handleVoiceChat,
  handleImageChat,
  getChatHistory
};