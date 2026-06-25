import React, { useState, useEffect, useRef } from "react";
import { chatService } from "../firebase";
import { 
  Send, Plus, Search, LogOut, Hash, Smile, Trash2, 
  Menu, X, Radio, MessageSquare, ShieldAlert, ArrowDown 
} from "lucide-react";

export default function Chat({ user, onSignOut }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomError, setRoomError] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isDemo = chatService.isDemoMode();

  const emojis = ["😊", "😂", "🔥", "👍", "🙌", "❤️", "😮", "🎉", "💻", "✨", "🚀", "🤔", "👀", "💯", "👋", "😎"];

  // 1. Subscribe to Rooms list
  useEffect(() => {
    const unsubscribe = chatService.subscribeToRooms((roomList) => {
      setRooms(roomList);
      // If activeRoom is not in the list, set active to the first room in list
      if (roomList.length > 0 && !roomList.includes(activeRoom)) {
        setActiveRoom(roomList[0]);
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // 2. Subscribe to Messages of active room
  useEffect(() => {
    setMessages([]); // Clear previous messages while switching
    const unsubscribe = chatService.subscribeToMessages(activeRoom, (msgs) => {
      setMessages(msgs);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [activeRoom]);

  // 3. Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show button if user has scrolled up more than 150px
    if (scrollHeight - scrollTop - clientHeight > 150) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessageText.trim();
    if (!text) return;
    if (text.length > 500) return;

    setNewMessageText("");
    setShowEmojiPicker(false);
    
    try {
      await chatService.sendMessage(activeRoom, text, user);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const name = newRoomName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    
    if (!name) {
      setRoomError("Room name must be alphanumeric (a-z, 0-9) and can include dashes.");
      return;
    }

    if (rooms.includes(name)) {
      setRoomError("Room already exists.");
      return;
    }

    try {
      await chatService.createRoom(name);
      setActiveRoom(name);
      setNewRoomName("");
      setRoomError("");
      setShowNewRoomModal(false);
    } catch (err) {
      setRoomError(err.message || "Failed to create room.");
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await chatService.deleteMessage(activeRoom, msgId);
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    }
  };

  const handleInsertEmoji = (emoji) => {
    setNewMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatMessageTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Sign out of Chattiko?")) {
      await chatService.signOut();
      onSignOut();
    }
  };

  // Filtered list of rooms
  const filteredRooms = rooms.filter((r) => 
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      
      {/* 1. Sidebar Panel */}
      <div className={`sidebar glass-panel ${sidebarOpen ? "open" : ""}`} style={{ borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)" }}>
        
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-neon)"
            }}>
              <MessageSquare size={18} color="#fff" />
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", letterSpacing: "1px" }}>CHATTIKO</h2>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(false)} 
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "none" }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rooms Search & Add */}
        <div style={{ padding: "16px 16px 8px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-cyber"
              style={{ width: "100%", paddingLeft: "36px", fontSize: "0.85rem", height: "38px" }}
            />
          </div>
          
          {/* Prominent Create Room Button */}
          <button 
            onClick={() => { setShowNewRoomModal(true); setRoomError(""); }}
            className="btn-primary" 
            style={{ 
              width: "100%", 
              height: "38px", 
              fontSize: "0.85rem", 
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--color-primary), #6d28d9)",
              border: "1px solid rgba(124, 58, 237, 0.3)"
            }}
          >
            <Plus size={16} />
            Create New Room
          </button>
        </div>

        {/* Room Scrollable List */}
        <div className="sidebar-rooms">
          {filteredRooms.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "0.85rem", marginTop: "20px" }}>
              No rooms found
            </p>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room}
                className={`room-item ${activeRoom === room ? "active" : ""}`}
                onClick={() => {
                  setActiveRoom(room);
                  setSidebarOpen(false);
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <Hash size={16} style={{ flexShrink: 0, color: activeRoom === room ? "var(--color-secondary)" : "var(--text-muted)" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Card Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <img src={user.photoURL} alt="user avatar" className="message-avatar" style={{ border: "2px solid rgba(139, 92, 246, 0.4)" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ 
                  fontWeight: "600", 
                  fontSize: "0.85rem", 
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {user.displayName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", marginTop: "2px" }}>
                  <span className={`status-badge ${isDemo ? "demo" : ""}`}></span>
                  <span style={{ color: "var(--text-muted)" }}>{isDemo ? "Local Storage" : "Firestore Online"}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                transition: "var(--transition-smooth)"
              }}
              title="Logout"
              className="logout-hover"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div className="chat-window glass-panel" style={{ borderRadius: "0 var(--radius-lg) var(--radius-lg) 0", position: "relative" }}>
        
        {/* Chat Window Header */}
        <div className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fff", display: "none" }}
              className="mobile-hamburger-btn"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <Hash size={18} color="var(--color-primary)" />
                {activeRoom}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Active discussions in #{activeRoom}
              </p>
            </div>
          </div>


        </div>

        {/* Chat Scrollable Area */}
        <div className="chat-messages" onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-muted)" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px dashed var(--border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px"
              }}>
                <MessageSquare size={20} />
              </div>
              <p style={{ fontSize: "0.9rem" }}>No messages here yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.uid === user.uid;
              return (
                <div key={msg.id} className={`message-row ${isSelf ? "self animate-slide" : "animate-slide"}`}>
                  <img src={msg.photoURL} alt="avatar" className="message-avatar" style={{ flexShrink: 0 }} />
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "calc(100% - 48px)" }}>
                    <div className="message-info">
                      <span className="message-username">{msg.displayName}</span>
                      <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                      {isSelf && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(239, 68, 68, 0.5)",
                            marginLeft: "4px",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                          className="trash-btn"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Section */}
        <div className="chat-input-area">
          <form onSubmit={handleSendMessage} style={{ position: "relative" }}>
            
            {/* Input and Buttons Container */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              
              {/* Emoji Trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="emoji-picker-btn"
                title="Select Emoji"
              >
                <Smile size={22} />
              </button>

              <div style={{ position: "relative", flex: 1 }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Message #${activeRoom}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="input-cyber"
                  style={{ width: "100%", paddingRight: "50px", height: "46px" }}
                  maxLength={500}
                />
                
                {/* Character Counter */}
                {newMessageText.length > 350 && (
                  <span style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.75rem",
                    color: newMessageText.length > 480 ? "#f87171" : "var(--text-muted)",
                    fontWeight: "600"
                  }}>
                    {500 - newMessageText.length}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!newMessageText.trim()}
                style={{
                  height: "46px",
                  padding: "0 20px",
                  opacity: !newMessageText.trim() ? 0.6 : 1,
                  cursor: !newMessageText.trim() ? "not-allowed" : "pointer"
                }}
              >
                <Send size={18} />
              </button>
            </div>

            {/* Emoji Selection Grid Popup */}
            {showEmojiPicker && (
              <div style={{
                position: "absolute",
                bottom: "56px",
                left: "0",
                zIndex: 200,
                width: "240px"
              }}>
                <div className="emoji-grid">
                  {emojis.map((emoji) => (
                    <span
                      key={emoji}
                      className="emoji-item"
                      onClick={() => handleInsertEmoji(emoji)}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "absolute",
              bottom: "86px",
              right: "30px",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-neon)",
              zIndex: 90,
              animation: "fadeIn 0.25s ease"
            }}
            title="Scroll to bottom"
          >
            <ArrowDown size={20} />
          </button>
        )}
      </div>

      {/* 3. Create Room Modal Overlay */}
      {showNewRoomModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Create New Room</h3>
              <button 
                onClick={() => setShowNewRoomModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {roomError && (
              <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                {roomError}
              </p>
            )}

            <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                  Room Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. secret-hacks, design-talk"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value.toLowerCase())}
                  className="input-cyber"
                  maxLength={15}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="btn-secondary"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "8px 16px" }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Mobile CSS Overrides */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-close-btn {
            display: block !important;
          }
          .mobile-hamburger-btn {
            display: block !important;
          }
          .sidebar-footer {
            border-radius: 0 !important;
          }
          .chat-window {
            border-radius: 0 !important;
          }
          .message-row {
            max-width: 90% !important;
          }
        }
        .logout-hover:hover {
          color: #f87171 !important;
          background: rgba(239, 68, 68, 0.1) !important;
        }
        .trash-btn:hover {
          color: #ef4444 !important;
          transform: scale(1.15);
        }
        .spin {
          animation: spin-anim 1.5s linear infinite;
        }
        @keyframes spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pulse-icon {
          animation: pulse-anim 1.8s infinite;
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

    </div>
  );
}
