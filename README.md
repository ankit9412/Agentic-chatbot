# AI Assistant - Gemini-like Web Application

A modern AI web application built with the MERN stack, featuring text chat, voice input, image analysis, and text-to-speech capabilities powered by Groq API.

## 🚀 Features

- **Text Chat**: Type questions and get AI responses
- **Voice Input**: Speak naturally using browser's Speech Recognition API
- **Image Analysis**: Upload images and ask questions about them (Vision AI)
- **Text-to-Speech**: AI responses can be read aloud
- **Live Voice Chat**: Continuous voice conversation like Gemini
- **Chat History**: Sidebar with conversation history
- **Dark Mode**: Toggle between light and dark themes

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Web Speech API
- **Backend**: Node.js, Express.js, MongoDB, Groq SDK
- **AI**: Groq API with LLaMA models for text and vision

## 🔧 Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd ai-assistant
npm install
cd server && npm install
cd ../client && npm install
```

2. **Setup environment**
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-assistant
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=development
```

3. **Run the application**
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔑 Getting Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up and create an API key
3. Add it to your `.env` file

## 📱 Usage

- **Text Chat**: Type in the input box
- **Voice Input**: Click microphone button
- **Live Voice Chat**: Click "Start Live Chat" for continuous conversation
- **Image Upload**: Click image button to upload and analyze images
- **Chat History**: Click menu button (top-left) to view conversation history

---

Built with ❤️ using MERN Stack and Groq AI