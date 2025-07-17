import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase-config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  setDoc
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import './IndividualChat.css';

export default function IndividualChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [otherName, setOtherName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const me = auth.currentUser?.uid;
    if (!me) return navigate("/");

    // Fetch the other user's name
    getDoc(doc(db, "users", userId))
      .then(snap => {
        if (snap.exists()) setOtherName(snap.data().username);
      })
      .catch(err => console.error(err));

    const msgsRef = collection(db, "messages");
    const sentQ = query(
      msgsRef,
      where("sender", "==", me),
      where("receiver", "==", userId),
      orderBy("timestamp")
    );
    const recvQ = query(
      msgsRef,
      where("sender", "==", userId),
      where("receiver", "==", me),
      orderBy("timestamp")
    );

    const toMillis = ts => ts && typeof ts.toMillis === "function" ? ts.toMillis() : Date.now();

    const handleSnap = snap => {
      const batch = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(prev => {
        const byId = {};
        prev.concat(batch).forEach(m => { byId[m.id] = m; });
        const merged = Object.values(byId).sort(
          (a, b) => toMillis(a.timestamp) - toMillis(b.timestamp)
        );
        setPending(p => p.filter(pid => !merged.some(m => m.id === pid && m.timestamp)));
        return merged;
      });
      setLoading(false);
    };

    const unsub1 = onSnapshot(sentQ, handleSnap);
    const unsub2 = onSnapshot(recvQ, handleSnap);

    return () => {
      unsub1(); unsub2();
    };
  }, [userId, navigate]);

  const sendMessage = async () => {
    const me = auth.currentUser?.uid;
    if (!me || !message.trim()) return;

    try {
      const ref = await addDoc(collection(db, "messages"), {
        text: message.trim(),
        sender: me,
        receiver: userId,
        timestamp: serverTimestamp()
      });

      setPending(p => [...p, ref.id]);
      setMessage("");

      const now = serverTimestamp();
      await setDoc(
        doc(db, "recentChats", me, "chats", userId),
        { userId, timestamp: now }
      );
      await setDoc(
        doc(db, "recentChats", userId, "chats", me),
        { userId: me, timestamp: now }
      );
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const getInitials = (username) => {
    if (!username) return "?";
    const names = username.split(" ");
    if (names.length > 1) {
      return names[0][0].toUpperCase() + names[1][0].toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addEmoji = (emoji) => {
    setMessage(message + emoji);
    setShowEmoji(false);
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '😎', '😍', '🥳'];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="back-btn" onClick={() => navigate('/chat')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </div>
        <div className="user-info">
          <div className="avatar">{getInitials(otherName)}</div>
          <div className="name-status">
            <div className="username">{otherName || "..."}</div>
            <div className="status"><span className="status-dot"></span> Online</div>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`message ${msg.sender === auth.currentUser.uid ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                {msg.text}
              </div>
              <div className="message-time">
                {formatTime(msg.timestamp)}
                {msg.sender === auth.currentUser.uid && (
                  <span className="check-mark">
                    {pending.includes(msg.id) ? "..." : " ✓✓"}
                  </span>
                )}
              </div>
            </div>
          ))
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
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />

        <button className="send-btn" onClick={sendMessage}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}