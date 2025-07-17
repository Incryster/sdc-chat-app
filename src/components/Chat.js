import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase-config";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const [myName, setMyName] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const currentUser = auth.currentUser?.uid;

  // Load current user's profile (username)
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser))
      .then((snap) => {
        if (snap.exists()) setMyName(snap.data().username);
      })
      .catch((err) => console.error("Error fetching my profile:", err));
  }, [currentUser]);

  // Real-time listener for recent chats
  useEffect(() => {
    if (!currentUser) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const recentRef = collection(db, "recentChats", currentUser, "chats");
    const recentQuery = query(recentRef, orderBy("timestamp", "desc"), limit(20));

    const unsub = onSnapshot(
      recentQuery,
      async (snapshot) => {
        const chats = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const { userId, timestamp: lastReadTs } = docSnap.data();
            const lastRead = lastReadTs ? lastReadTs.toDate() : new Date();

            // fetch other user's name
            let username = userId;
            try {
              const uSnap = await getDoc(doc(db, "users", userId));
              if (uSnap.exists()) username = uSnap.data().username;
            } catch (e) {
              console.warn("Failed to fetch user profile", e);
            }

            // fetch last exchanged message and unread count
            let lastMessage = "";
            let lastMsgTs = lastRead;
            let hasNew = false;
            let newMessageCount = 0; // Track unread messages

            try {
              const msgs = collection(db, "messages");
              const sentQ = query(
                msgs,
                where("sender", "==", currentUser),
                where("receiver", "==", userId),
                orderBy("timestamp", "desc"),
                limit(1)
              );
              const recvQ = query(
                msgs,
                where("sender", "==", userId),
                where("receiver", "==", currentUser),
                orderBy("timestamp", "desc"),
                limit(1)
              );
              
              // To count unread messages, we need an additional query
              const unreadQ = query(
                msgs,
                where("sender", "==", userId),
                where("receiver", "==", currentUser),
                where("timestamp", ">", lastRead)
              );
              
              const [sentSnap, recvSnap, unreadSnap] = await Promise.all([getDocs(sentQ), getDocs(recvQ), getDocs(unreadQ)]);

              // Count unread messages
              newMessageCount = unreadSnap.docs.length;
              hasNew = newMessageCount > 0;

              const sentDoc = sentSnap.docs[0];
              const recvDoc = recvSnap.docs[0];

              // Check sent messages
              if (sentDoc) {
                const sentData = sentDoc.data();
                const sentTs = sentData.timestamp ? sentData.timestamp.toDate() : new Date();

                if (!recvDoc || sentTs > (recvDoc.data().timestamp ? recvDoc.data().timestamp.toDate() : new Date())) {
                  lastMessage = sentData.text;
                  lastMsgTs = sentTs;
                }
              }

              // Check received messages
              if (recvDoc) {
                const recvData = recvDoc.data();
                const recvTs = recvData.timestamp ? recvData.timestamp.toDate() : new Date();

                if (!sentDoc || recvTs > (sentDoc.data().timestamp ? sentDoc.data().timestamp.toDate() : new Date())) {
                  lastMessage = recvData.text;
                  lastMsgTs = recvTs;
                }
              }

            } catch (e) {
              console.warn("Failed to fetch last message", e);
            }

            // format time ago
            const now = new Date();
            const diffMs = now - lastMsgTs;
            let timeAgo;
            if (diffMs < 60_000) timeAgo = "now";
            else if (diffMs < 3_600_000) timeAgo = `${Math.floor(diffMs / 60_000)} min ago`;
            else if (diffMs < 86_400_000) timeAgo = `${Math.floor(diffMs / 3_600_000)} hrs ago`;
            else timeAgo = `${Math.floor(diffMs / 86_400_000)} days ago`;

            return { userId, username, lastMessage, timeAgo, hasNew, newMessageCount };
          })
        );

        setRecentChats(chats);
        setFilteredChats(chats);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load chats.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Search users by exact username
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredChats(recentChats);
      setError("");
      return;
    }
    
    const searchQueryLower = searchQuery.trim().toLowerCase();  // Convert query to lowercase
  
    try {
      const usersQ = query(
        collection(db, "users"),
        where("username", "==", searchQueryLower)  // Query by lowercase username
      );
      const snaps = await getDocs(usersQ);
      
      if (snaps.empty) {
        setFilteredChats([]);
        setError("No users found.");
      } else {
        const results = snaps.docs.map((u) => ({ userId: u.id, username: u.data().username }));
        setFilteredChats(results);
        setError("");
      }
    } catch (e) {
      console.error(e);
      setError("Search failed.");
    }
  }, [searchQuery, recentChats]);
  

  // Start or open chat
  const openChat = useCallback(
    async ({ userId }) => {
      if (!currentUser) return;
      const now = serverTimestamp();
      // bump for both users
      await Promise.all([
        setDoc(
          doc(db, "recentChats", currentUser, "chats", userId),
          { userId, timestamp: now },
          { merge: true }
        ),
        setDoc(
          doc(db, "recentChats", userId, "chats", currentUser),
          { userId: currentUser, timestamp: now },
          { merge: true }
        ),
      ]);
      navigate(`/chat/${userId}`);
    },
    [currentUser, navigate]
  );

  // Utility: initials for avatars
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  // Render chat rows
  const renderRow = (chat) => (
    <div
      key={chat.userId}
      onClick={() => openChat(chat)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem",
        backgroundColor: chat.hasNew ? "#f0f7ff" : "white",
        borderRadius: "8px",
        cursor: "pointer",
        borderLeft: chat.hasNew ? "4px solid #6c63ff" : "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        marginBottom: "0.5rem",
        "&:hover": {
          backgroundColor: "#f3eef8",
        },
      }}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          backgroundColor: "#e8e8fc",
          color: "#6c63ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "1.1rem",
        }}
      >
        {getInitials(chat.username)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "#333" }}>
          {chat.username}
          {chat.hasNew && (
            <span
              style={{
                fontSize: "0.7rem",
                backgroundColor: "#6c63ff",
                color: "white",
                borderRadius: "50px",
                padding: "0.1rem 0.5rem",
                marginLeft: "0.5rem",
              }}
            >
              {chat.newMessageCount}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: chat.hasNew ? "#0056b3" : "#6c757d",
            fontWeight: chat.hasNew ? "500" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "250px",
          }}
        >
          {chat.hasNew
            ? `${chat.newMessageCount} new message${chat.newMessageCount > 1 ? "s" : ""}`
            : chat.lastMessage || "Start a conversation"}
        </div>
      </div>
      <div style={{ fontSize: "0.75rem", color: "#6c757d" }}>
        {chat.timeAgo || ""}
        {!chat.hasNew && chat.lastMessage && (
          <div style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            backgroundColor: "#22c55e", 
            display: "inline-block",
            marginLeft: "5px",
          }}/>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f3eef8" }}>
      <header
        style={{
          padding: "1rem",
          borderBottom: "1px solid #dee2e6",
          backgroundColor: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#e8e8fc",
              color: "#6c63ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {getInitials(myName)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "#333" }}>{myName || "Unknown User"}</div>
            
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            onClick={() => navigate("/chatbot")} 
            style={{ 
              background: "#6c63ff", 
              border: "none",
              borderRadius: "20px", 
              padding: "0.5rem 1rem",
              color: "white",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#5b52e5"
              }
            }}
          >
            Chat with AI Bot
          </button>
          <button 
            onClick={() => signOut(auth).then(() => navigate("/"))} 
            style={{ 
              background: "none", 
              border: "1px solid #6c63ff",
              borderRadius: "20px", 
              padding: "0.5rem 1rem",
              color: "#6c63ff",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#f3eef8"
              }
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 600, color: "#333" }}>Messages</h2>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "24px",
              border: "1px solid #ced4da",
              fontSize: "1rem",
              backgroundColor: "#e0d8f0",
              "&:focus": {
                outline: "none",
                borderColor: "#a855f7",
                boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.25)",
              },
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              backgroundColor: "#6c63ff",
              color: "white",
              border: "none",
              borderRadius: "24px",
              padding: "0 1.5rem",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background-color 0.2s ease",
              "&:hover": {
                backgroundColor: "#5b52e5",
              },
            }}
          >
            Find User
          </button>
        </div>

        {error && <div style={{ color: "#dc3545", marginBottom: "1rem", padding: "0.75rem", backgroundColor: "rgba(220, 53, 69, 0.1)", borderRadius: "8px" }}>{error}</div>}
        {loading && (
          <div style={{ 
            textAlign: "center", 
            padding: "2rem", 
            color: "#6c63ff", 
            fontWeight: "500"
          }}>
            Loading chats...
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filteredChats.map((chat) => renderRow(chat))}
          {!loading && filteredChats.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              color: "#666",
              backgroundColor: "white", 
              padding: "2rem",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
            }}>
              {searchQuery ? "No users found matching your search" : "No conversations yet"}
              <div style={{ 
                marginTop: "1rem", 
                fontSize: "0.875rem", 
                color: "#6c757d" 
              }}>
                {searchQuery ? "Try searching for another username" : "Search for users to start chatting"}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;