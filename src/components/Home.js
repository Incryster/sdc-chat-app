import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container min-h-screen main-gradient-bg">
      <header className="header">
        <div className="container flex items-center justify-between">
          <div className="logo-container flex items-center gap-2">
            <svg className="logo-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C10.2307 21 8.59757 20.4505 7.23582 19.5022L3 21L4.49778 16.7642C3.54952 15.4024 3 13.7693 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="logo-text">Sdc Chat</span>
          </div>
          <nav className="nav-buttons">
            <Link to="/login" className="btn-outline">Login</Link>
            <Link to="/signup" className="btn-primary">Sign up</Link>
          </nav>
        </div>
      </header>
      
      <main className="container main-content">
        <section className="hero-section">
          <h1 className="hero-title">
            Sdc Chat 
            <span className="emoji-bounce">💬</span>
          </h1>
          <p className="hero-description">
            The <span className="highlight">coolest</span> way to chat with your friends. No cap.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/signup" className="btn-primary">Sign Up Free</Link>
          </div>
        </section>
        
        <section className="chat-preview">
          <div className="chat-container">
            <div className="chat-glow"></div>
            <div className="chat-box glass-card">
              <div className="chat-header">
                <div className="chat-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C10.2307 21 8.59757 20.4505 7.23582 19.5022L3 21L4.49778 16.7642C3.54952 15.4024 3 13.7693 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="chat-title">Sdc Chat</h3>
              </div>
              
              <div className="chat-messages">
                <div className="message-receiver">Hey, what's up? 😎</div>
                <div className="message-sender">Just vibing rn, hbu?</div>
                <div className="message-receiver">Same! Wanna hang later?</div>
                <div className="message-sender">That's fire 🔥 I'm in!</div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-emoji">🚀</div>
            <h3 className="feature-title">Super Fast</h3>
            <p className="feature-desc">Message your friends with zero lag</p>
          </div>
          
          <div className="feature-card glass-card">
            <div className="feature-emoji">🔒</div>
            <h3 className="feature-title">Private Chats</h3>
            <p className="feature-desc">Your convos stay between you</p>
          </div>
          
          <div className="feature-card glass-card">
            <div className="feature-emoji">📱</div>
            <h3 className="feature-title">Mobile Friendly</h3>
            <p className="feature-desc">Chat on any device, anywhere</p>
          </div>
        </section>
      </main>
      
      <footer className="footer">
        <div className="container footer-content">
          <p className="copyright">© 2025 Sdc Chat. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/" className="footer-link">Privacy</Link>
            <Link to="/" className="footer-link">Terms</Link>
            <Link to="/" className="footer-link">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}