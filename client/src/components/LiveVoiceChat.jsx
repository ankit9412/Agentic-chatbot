import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, VolumeX, Phone, X, Video, ImageIcon, Globe } from 'lucide-react';
import { sendVoiceMessage, sendImageMessage } from '../services/api';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English', label: 'English (US)' },
];

function LiveVoiceChat({ sessionId, onNewMessage }) {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const recognitionRef = useRef(null);
  const conversationActiveRef = useRef(false);
  const shouldRestartRecognitionRef = useRef(true);

  // Refs to track state in closures
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Pre-load voices
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
    };
    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langCode = selectedLanguage.code === 'bho-IN' ? 'hi-IN' : selectedLanguage.code;
      recognition.lang = langCode;

      recognition.onstart = () => {
        console.log('Recognition started');
        setIsListening(true);
        setError(null);
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

        if (finalTranscript && conversationActiveRef.current && !isProcessingRef.current) {
          console.log('Final transcript received:', finalTranscript);
          shouldRestartRecognitionRef.current = false;
          try {
            recognition.stop();
          } catch (e) {
            console.log('Error stopping recognition:', e);
          }
          handleVoiceInput(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error !== 'aborted') {
          setError(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('Recognition ended. Should restart?', shouldRestartRecognitionRef.current);
        setIsListening(false);
        
        if (conversationActiveRef.current && shouldRestartRecognitionRef.current) {
          setTimeout(() => {
            if (conversationActiveRef.current && shouldRestartRecognitionRef.current) {
              try {
                recognition.start();
              } catch (error) {
                console.error('Error restarting recognition:', error);
              }
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
    }

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (recognitionRef.current) {
        shouldRestartRecognitionRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearInterval(timeInterval);
    };
  }, [selectedLanguage]); 

  const handleVoiceInput = async (text) => {
    if (!text || isProcessingRef.current) return;

    console.log('Processing voice input:', text);
    setIsProcessing(true);
    shouldRestartRecognitionRef.current = false;

    try {
      let response;
      const langName = selectedLanguage.name;

      if (uploadedImage) {
        console.log('Sending image + voice question to AI');
        response = await sendImageMessage(uploadedImage, text, sessionId, langName);
        setUploadedImage(null);
        setImagePreview(null);
      } else {
        response = await sendVoiceMessage(text, sessionId, langName);
      }

      console.log('✅ AI response received:', response.response);
      setTranscript('');

      if (!isMuted) {
        await speakResponse(response.response);
      } else {
        shouldRestartRecognitionRef.current = true;
        if (conversationActiveRef.current) {
          try { recognitionRef.current?.start(); } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Voice input error:', error);
      setError(error.message);
      setTranscript('');
      await speakResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || isMuted) {
        resolve();
        if (conversationActiveRef.current) {
            shouldRestartRecognitionRef.current = true;
            try { recognitionRef.current?.start(); } catch (e) {}
        }
        return;
      }

      window.speechSynthesis.resume(); 
      window.speechSynthesis.cancel();

      let attempts = 0;
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();

        if (voices.length === 0 && attempts < 10) {
          attempts++;
          setTimeout(trySpeak, 100);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;

        let targetLang = selectedLanguage.code === 'bho-IN' ? 'hi-IN' : selectedLanguage.code;
        let selectedVoice = null;

        if (targetLang === 'en-US') {
          selectedVoice = voices.find(v => v.lang === 'en-IN');
          if (!selectedVoice) {
            selectedVoice = voices.find(v => (v.name.includes('India') || v.name.includes('Indian')) && v.lang.startsWith('en'));
          }
           if (!selectedVoice) {
               selectedVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')) && v.lang === 'en-US');
           }
          if (selectedVoice && selectedVoice.lang === 'en-IN') {
            targetLang = selectedVoice.lang;
          }
        }

        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang === targetLang);
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.lang = targetLang;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          if (conversationActiveRef.current && !isMuted) {
             shouldRestartRecognitionRef.current = true;
             setTimeout(() => {
                if (conversationActiveRef.current) {
                    try { recognitionRef.current?.start(); } catch (e) {
                        console.log("Failed to restart recognition after speaking", e);
                    }
                }
             }, 200);
          }
          resolve();
        };

        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          setIsSpeaking(false);
          if (conversationActiveRef.current) {
             shouldRestartRecognitionRef.current = true;
             try { recognitionRef.current?.start(); } catch (e) {}
          }
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      };

      trySpeak();
    });
  };

  const resumeListening = () => {
     shouldRestartRecognitionRef.current = true;
     try { recognitionRef.current?.start(); } catch (e) {}
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Invalid image type');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image too large');
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const startLiveMode = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }
    setShowModal(true);
    setIsLiveMode(true);
    conversationActiveRef.current = true;
    setError(null);
    shouldRestartRecognitionRef.current = true;
    try { recognitionRef.current.start(); } catch (error) { }
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    setShowModal(false);
    setShowLanguageMenu(false);
    conversationActiveRef.current = false;
    shouldRestartRecognitionRef.current = false;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }

    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setIsProcessing(false);
    setUploadedImage(null);
    setImagePreview(null);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    return (
      <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 text-center">
        <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Live voice chat not supported in this browser
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Live Voice Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Talk naturally with AI like Gemini</p>
            </div>
          </div>

          <button
            onClick={startLiveMode}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            <Phone className="w-4 h-4" />
            <span>Start Live Chat</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 text-white relative">
            <div className="text-lg font-medium w-1/3">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            <div className="flex items-center justify-center space-x-2 w-1/3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-medium">Live</span>
            </div>

            <div className="flex items-center justify-end space-x-4 w-1/3">
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-md">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">English</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 min-h-0">
            <div className={`w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-8 shadow-2xl transition-all duration-300 ${
              isSpeaking ? 'scale-110 shadow-purple-500/50' : isListening ? 'scale-105 shadow-blue-500/50' : ''
            }`}>
              <span className="text-white font-bold text-4xl">AI</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isProcessing ? 'Processing... (' + selectedLanguage.name + ')' : isSpeaking ? 'AI Speaking (' + selectedLanguage.name + ')' : isListening ? 'Listening (' + selectedLanguage.name + ')...' : 'Ready to Chat'}
              </h2>
              <p className="text-blue-200">
                {isProcessing ? 'Translating and thinking...' : isSpeaking ? 'AI is responding to you' : isListening ? 'Speak naturally in ' + selectedLanguage.name : 'Say something to start'}
              </p>
            </div>

            <div className="mb-16 h-32 flex items-center justify-center">
              {isListening && (
                <div className="flex space-x-3">
                  <div className="w-4 h-12 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-4 h-20 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-4 h-8 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-4 h-16 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <div className="w-4 h-14 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              )}
              {isSpeaking && (
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-purple-400 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 w-24 h-24 border-2 border-purple-300 rounded-full animate-pulse"></div>
                  <div className="absolute inset-4 w-16 h-16 bg-purple-500 rounded-full animate-bounce flex items-center justify-center">
                     <Volume2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
              {isProcessing && (
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {!isListening && !isSpeaking && !isProcessing && (
                <div className="w-24 h-24 border-2 border-gray-500 rounded-full flex items-center justify-center">
                  <Mic className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400 rounded-xl p-4 mb-4 max-w-md w-full">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-8 pb-8">
            <button className="w-14 h-14 bg-gray-700/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-600/50 transition-colors">
              <Video className="w-6 h-6 text-white" />
            </button>

            <label className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all ${uploadedImage ? 'bg-blue-500/80' : 'bg-gray-700/50 backdrop-blur-sm hover:bg-gray-600/50'}`}>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <ImageIcon className="w-6 h-6 text-white" />
            </label>

            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/80 shadow-lg' : 'bg-gray-700/50 backdrop-blur-sm hover:bg-gray-600/50'}`}>
              {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
            </button>

            <button className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-green-500 shadow-lg' : isSpeaking ? 'bg-purple-500 shadow-lg' : 'bg-gray-700/50 backdrop-blur-sm'}`}>
              <Mic className="w-8 h-8 text-white" />
            </button>

            <button onClick={stopLiveMode} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <X className="w-8 h-8 text-white" />
            </button>
          </div>

          {imagePreview && (
            <div className="absolute bottom-24 left-4 right-4 flex justify-center">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3 max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">Image uploaded</span>
                  <button onClick={clearImage} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <img src={imagePreview} alt="Uploaded" className="w-full h-20 object-cover rounded-lg" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default LiveVoiceChat;