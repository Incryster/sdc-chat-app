import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase-config";

import Home from "./components/Home";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Chat from "./components/Chat";
import IndividualChat from "./components/IndividualChat";
import ChatBot from './components/ChatBot'; // Importing ChatBot component

// Global reset styles
const globalStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html, body, #root {
    height: 100%;
  }
`;

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Inject global styles
    const styleTag = document.createElement('style');
    styleTag.innerHTML = globalStyles;
    document.head.appendChild(styleTag);

    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh",
      backgroundColor: "#f8f9fa"
    }}>
      <div>Loading…</div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Landing + Public */}
        <Route
          path="/"
          element={!user ? <Home /> : <Navigate to="/chat" replace />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/chat" replace />}
        />
        <Route
          path="/signup"
          element={!user ? <SignUp /> : <Navigate to="/chat" replace />}
        />

        {/* Protected */}
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/" replace />}
        />
        <Route
          path="/chat/:userId"
          element={user ? <IndividualChat /> : <Navigate to="/" replace />}
        />

        {/* ChatBot Route */}
        <Route
          path="/chatbot"
          element={user ? <ChatBot /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
