import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import Home from './pages/Home';
import ChatSidebar from './components/ChatSidebar';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectChat = (sessionId) => {
    setSelectedSessionId(sessionId);
    setSidebarOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors duration-300">
      {/* Chat Sidebar */}
      <ChatSidebar 
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onSelectChat={handleSelectChat}
        currentSessionId={selectedSessionId}
      />

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                AI Assistant
              </h1>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Home selectedSessionId={selectedSessionId} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-600 dark:text-gray-300 font-medium">
            AI Assistant powered by Ankit
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;