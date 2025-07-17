import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import './ChatBot.css';

const ChatBot = () => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);

  // Access the Gemini API Key from environment variables
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API key is missing!");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      text: userInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setUserInput('');

    try {
      // Modify the contents to ask for short, human-like responses
      const prompt = `Be brief and provide a short, clear response: ${userInput.trim()}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const botMessage = {
        id: Date.now().toString() + '-bot',
        text: response.text || 'Sorry, I couldn\'t generate a response.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      
      const errorMessage = {
        id: Date.now().toString() + '-error',
        text: 'Sorry, something went wrong.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addEmoji = (emoji) => {
    setUserInput(userInput + emoji);
    setShowEmoji(false);
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '😎', '😍', '🥳'];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar">AI</div>
          <div className="name-status">
            <div className="username">Chat Bot</div>
            <div className="status"><span className="status-dot"></span> Online</div>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to Chat Bot!</h3>
            <p>Ask me anything and I'll try to help you.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`message ${msg.sender === 'user' ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                {msg.text}
              </div>
              <div className="message-time">
                {formatTime(msg.timestamp)}
                {msg.sender === 'user' && (
                  <span className="check-mark">✓✓</span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="message received">
            <div className="message-bubble typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <button 
          className="emoji-btn"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          😊
        </button>
        
        {showEmoji && (
          <div className="emoji-picker">
            {emojis.map((emoji, index) => (
              <button 
                key={index}
                onClick={() => addEmoji(emoji)}
                className="emoji-option"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Type a message..."
          value={userInput}
          onChange={handleUserInputChange}
          onKeyDown={e => e.key === "Enter" && handleSendMessage()}
        />

        <button className="send-btn" onClick={handleSendMessage} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatBot;