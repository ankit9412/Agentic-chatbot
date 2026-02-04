import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

function VoiceInput({ onVoiceMessage, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);

        // Auto-send when user pauses (final result)
        if (finalTranscript && event.results[event.results.length - 1].isFinal) {
          setTimeout(() => {
            if (finalTranscript.trim()) {
              onVoiceMessage(finalTranscript.trim());
              setTranscript('');
              stopListening();
            }
          }, 1000); // Wait 1 second after final result
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onVoiceMessage]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !disabled) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="btn-secondary flex items-center justify-center w-12 h-12 rounded-xl opacity-50 cursor-not-allowed"
          aria-label="Voice input not supported"
        >
          <MicOff className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Voice input not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'btn-secondary'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <Square className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Live transcript display */}
      {isListening && transcript && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg min-w-64 max-w-80">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Listening...</div>
          <div className="text-sm text-gray-900 dark:text-gray-100">{transcript}</div>
        </div>
      )}

      {/* Status indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
}

export default VoiceInput;