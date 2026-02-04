import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// API functions
export const sendTextMessage = async (message, sessionId = null, language = null) => {
  try {
    const response = await api.post('/ai/chat', {
      message,
      sessionId,
      language
    });
    return response.data;
  } catch (error) {
    console.error('Error sending text message:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send message';
    throw new Error(errorMessage);
  }
};

export const sendVoiceMessage = async (message, sessionId = null, language = null) => {
  try {
    const response = await api.post('/ai/voice', {
      message,
      sessionId,
      language
    });
    return response.data;
  } catch (error) {
    console.error('Error sending voice message:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send voice message';
    throw new Error(errorMessage);
  }
};

export const sendImageMessage = async (imageFile, question, sessionId = null, language = null) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('question', question);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    if (language) {
      formData.append('language', language);
    }

    const response = await api.post('/ai/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error sending image message:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send image message';
    throw new Error(errorMessage);
  }
};

export const getChatHistory = async (sessionId) => {
  try {
    const response = await api.get(`/ai/history/${sessionId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get chat history');
  }
};

export default api;