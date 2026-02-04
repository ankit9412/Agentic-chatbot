import React, { useState, useEffect } from 'react';
import { User, Bot, Mic, Image as ImageIcon, Volume2, VolumeX, Copy, Check } from 'lucide-react';

function Message({ message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [currentUtterance, setCurrentUtterance] = useState(null);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const isUser = message.role === 'user';
  const isError = message.type === 'error';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleSpeak = () => {
    if (!speechSynthesis) {
      alert('Text-to-speech is not supported in this browser');
      return;
    }

    if (isPlaying) {
      // Stop current speech
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentUtterance(null);
    } else {
      // Start new speech
      const utterance = new SpeechSynthesisUtterance(message.content);
      
      // Configure voice settings for natural female voice
      utterance.rate = 0.85; // Slightly slower for more natural speech
      utterance.pitch = 1.1;  // Slightly higher pitch for female voice
      utterance.volume = 0.9;

      // Try to use a more natural female voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        // Prioritize female voices
        (voice.name.includes('Female') || 
         voice.name.includes('Woman') ||
         voice.name.includes('Zira') ||
         voice.name.includes('Hazel') ||
         voice.name.includes('Samantha') ||
         voice.name.includes('Karen') ||
         voice.name.includes('Susan') ||
         voice.name.includes('Moira') ||
         voice.name.includes('Tessa') ||
         voice.name.includes('Veena') ||
         voice.name.includes('Fiona') ||
         voice.name.includes('Google UK English Female') ||
         voice.name.includes('Microsoft Zira') ||
         voice.name.includes('Microsoft Hazel')) &&
        voice.lang.startsWith('en')
      ) || voices.find(voice => 
        // Fallback to any good English voice
        (voice.name.includes('Google') || 
         voice.name.includes('Microsoft')) &&
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Selected voice:', preferredVoice.name);
      }

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentUtterance(null);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsPlaying(false);
        setCurrentUtterance(null);
      };

      setCurrentUtterance(utterance);
      speechSynthesis.speak(utterance);
    }
  };

  const getMessageIcon = () => {
    if (isUser) {
      if (message.type === 'voice') {
        return <Mic className="w-5 h-5" />;
      } else if (message.type === 'image') {
        return <ImageIcon className="w-5 h-5" />;
      } else {
        return <User className="w-5 h-5" />;
      }
    } else {
      return <Bot className="w-5 h-5" />;
    }
  };

  const getMessageTypeLabel = () => {
    switch (message.type) {
      case 'voice':
        return 'Voice';
      case 'image':
        return 'Image';
      case 'error':
        return 'Error';
      default:
        return null;
    }
  };

  return (
    <div className={`chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'} ${isError ? 'border-l-4 border-red-500' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${
            isUser 
              ? 'bg-primary-500 text-white' 
              : isError 
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
          }`}>
            {getMessageIcon()}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {isUser ? 'You' : 'AI Assistant'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatTime(message.timestamp)}</span>
              {getMessageTypeLabel() && (
                <>
                  <span>•</span>
                  <span>{getMessageTypeLabel()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isUser && !isError && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSpeak}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              aria-label={isPlaying ? 'Stop speaking' : 'Read aloud'}
              title={isPlaying ? 'Stop speaking' : 'Read aloud'}
            >
              {isPlaying ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              aria-label="Copy message"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Image Display */}
      {message.type === 'image' && message.imageUrl && (
        <div className="mb-4">
          <img
            src={message.imageUrl}
            alt="Uploaded image"
            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-dark-700"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`prose prose-sm max-w-none ${
        isError 
          ? 'text-red-700 dark:text-red-400' 
          : 'text-gray-900 dark:text-gray-100'
      }`}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>

      {/* Voice Indicator */}
      {message.type === 'voice' && isUser && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
          Transcribed from voice input
        </div>
      )}
    </div>
  );
}

export default Message;