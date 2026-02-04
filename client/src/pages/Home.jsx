import React, { useState, useEffect, useRef } from 'react';
import ChatBox from '../components/ChatBox';
import VoiceInput from '../components/VoiceInput';
import ImageUpload from '../components/ImageUpload';
import Message from '../components/Message';
import LiveVoiceChat from '../components/LiveVoiceChat';
import { sendTextMessage, sendVoiceMessage, sendImageMessage } from '../services/api';

function Home({ selectedSessionId }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate session ID on first load
  useEffect(() => {
    if (!selectedSessionId) {
      const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      setSessionId(newSessionId);
    }
  }, [selectedSessionId]);

  // Handle selected session from sidebar
  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== sessionId) {
      loadChatHistory(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadChatHistory = async (sessionId) => {
    try {
      // In a real app, you'd fetch from your API
      // For now, we'll use localStorage
      const savedMessages = localStorage.getItem(`chat_${sessionId}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
          setSessionId(sessionId);
        } catch (error) {
           console.error('Failed to parse chat messages:', error);
           localStorage.removeItem(`chat_${sessionId}`);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatToStorage = (sessionId, messages) => {
    localStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));
    
    // Also save to sidebar history
    if (messages.length > 0) {
      const event = new CustomEvent('saveChatHistory', {
        detail: { sessionId, messages }
      });
      window.dispatchEvent(event);
    }
  };

  const handleTextMessage = async (message) => {
    if (!message.trim()) return;

    setError(null);
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendTextMessage(message, sessionId);
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        type: 'text',
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);
      saveChatToStorage(sessionId, updatedMessages);
      
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
      }
    } catch (error) {
      console.error('Text message error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = async (transcript) => {
    if (!transcript.trim()) return;

    setError(null);
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: transcript,
      type: 'voice',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendVoiceMessage(transcript, sessionId);
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        type: 'voice',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
      }
    } catch (error) {
      console.error('Voice message error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageMessage = async (imageFile, question) => {
    if (!imageFile || !question.trim()) return;

    setError(null);
    
    const imageUrl = URL.createObjectURL(imageFile);
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question,
      type: 'image',
      imageUrl: imageUrl,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendImageMessage(imageFile, question, sessionId);
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        type: 'image',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
      }
    } catch (error) {
      console.error('Image message error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    // Generate new session ID
    const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4 space-y-8">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to AI Assistant
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Ask me anything using text, voice, or images. I'm powered by Groq AI and ready to help!
              </p>
            </div>

            {/* Live Voice Chat Feature */}
            <LiveVoiceChat 
              sessionId={sessionId} 
              onNewMessage={handleNewMessage}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold mb-1">Text Chat</h3>
                <p className="text-gray-600 dark:text-gray-400">Type your questions and get instant responses</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <div className="text-2xl mb-2">🎤</div>
                <h3 className="font-semibold mb-1">Voice Input</h3>
                <p className="text-gray-600 dark:text-gray-400">Speak your questions naturally</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <div className="text-2xl mb-2">🖼️</div>
                <h3 className="font-semibold mb-1">Image Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400">Upload images and ask questions about them</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Live Voice Chat - Always visible when chatting */}
            <LiveVoiceChat 
              sessionId={sessionId} 
              onNewMessage={handleNewMessage}
            />
            
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="chat-bubble ai-bubble">
                <div className="flex items-center space-x-2">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <VoiceInput onVoiceMessage={handleVoiceMessage} disabled={isLoading} />
              <ImageUpload onImageMessage={handleImageMessage} disabled={isLoading} />
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="btn-secondary text-sm"
                disabled={isLoading}
              >
                Clear Chat
              </button>
            )}
          </div>
          
          <ChatBox onSendMessage={handleTextMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default Home;