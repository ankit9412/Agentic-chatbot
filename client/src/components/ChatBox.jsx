import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';

function ChatBox({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
          className="input-field resize-none min-h-[48px] max-h-[120px] pr-12"
          disabled={disabled}
          rows={1}
        />
        
        {/* Character count */}
        {message.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
            {message.length}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="btn-primary flex items-center justify-center w-12 h-12 rounded-xl"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}

export default ChatBox;