import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Bot, X, Menu, Trash2, Search } from 'lucide-react';

function ChatSidebar({ isOpen, onToggle, onSelectChat, currentSessionId }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedChats = localStorage.getItem('chatHistory');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChatHistory(parsedChats);
        setFilteredChats(parsedChats);
      } catch (error) {
        console.error('Failed to parse chat history:', error);
        localStorage.removeItem('chatHistory');
      }
    }

    // Listen for chat history updates
    const handleSaveChatHistory = (event) => {
      const { sessionId, messages } = event.detail;
      saveChatToHistory(sessionId, messages);
    };

    window.addEventListener('saveChatHistory', handleSaveChatHistory);
    
    return () => {
      window.removeEventListener('saveChatHistory', handleSaveChatHistory);
    };
  }, []);

  useEffect(() => {
    // Filter chats based on search term
    if (searchTerm.trim() === '') {
      setFilteredChats(chatHistory);
    } else {
      const filtered = chatHistory.filter(chat =>
        chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.preview.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chatHistory]);

  const saveChatToHistory = (sessionId, messages) => {
    if (!messages || messages.length === 0) return;

    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return;

    const title = firstUserMessage.content.length > 50 
      ? firstUserMessage.content.substring(0, 50) + '...'
      : firstUserMessage.content;

    const preview = messages.length > 1 
      ? messages[1].content.substring(0, 100) + '...'
      : 'No response yet';

    const chatData = {
      sessionId,
      title,
      preview,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      type: firstUserMessage.type || 'text'
    };

    const updatedHistory = [chatData, ...chatHistory.filter(chat => chat.sessionId !== sessionId)];
    setChatHistory(updatedHistory);
    setFilteredChats(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  const deleteChatFromHistory = (sessionId, e) => {
    e.stopPropagation();
    const updatedHistory = chatHistory.filter(chat => chat.sessionId !== sessionId);
    setChatHistory(updatedHistory);
    setFilteredChats(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    setChatHistory([]);
    setFilteredChats([]);
    localStorage.removeItem('chatHistory');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'voice':
        return '🎤';
      case 'image':
        return '🖼️';
      default:
        return '💬';
    }
  };

  // Expose saveChatToHistory function to parent component
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    saveChatToHistory
  }));

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-20 left-4 z-50 p-3 bg-white dark:bg-dark-800 rounded-full shadow-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
        aria-label="Toggle chat history"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chat History
            </h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchTerm ? 'No conversations found' : 'No chat history yet'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                {searchTerm ? 'Try a different search term' : 'Start a conversation to see it here'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat.sessionId}
                  onClick={() => onSelectChat(chat.sessionId)}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-dark-800 mb-2 ${
                    currentSessionId === chat.sessionId 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                      : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{getTypeIcon(chat.type)}</span>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {chat.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                        {chat.preview}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(chat.timestamp)}</span>
                          <span>•</span>
                          <span>{chat.messageCount} messages</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteChatFromHistory(chat.sessionId, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {chatHistory.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-dark-700">
            <button
              onClick={clearAllHistory}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatSidebar;