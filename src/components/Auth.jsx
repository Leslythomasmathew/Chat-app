import React, { useState } from "react";
import { chatService } from "../firebase";
import { Settings, Shield, ChevronDown, ChevronUp, Info } from "lucide-react";

export default function Auth({ onAuthSuccess }) {
  const AVATARS = ["Gamer", "Cyber", "Midnight", "Shadow", "Phoenix", "Aether", "Ghost", "Neon"];
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isDemo = chatService.isDemoMode();

  // Firebase Config Form States (for custom firestore connection)
  const currentConfig = chatService.getFirebaseConfig() || {};
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || "");
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || "");
  const [projectId, setProjectId] = useState(currentConfig.projectId || "");
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || "");
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || "");
  const [appId, setAppId] = useState(currentConfig.appId || "");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a nickname to proceed.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await chatService.signIn(username, selectedAvatar);
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim() || !authDomain.trim()) {
      setError("API Key, Project ID, and Auth Domain are required for Firebase connection.");
      return;
    }

    chatService.setFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    });
  };

  const handleClearConfig = () => {
    chatService.clearFirebaseConfig();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "420px" }}>
        
        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            boxShadow: "var(--shadow-neon)",
            marginBottom: "16px"
          }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "800", background: "linear-gradient(135deg, #fff, var(--text-secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "6px" }}>
            CHATTIKO
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Enter a nickname and start chatting instantly.
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {/* Username Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            background: isDemo ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)",
            border: isDemo ? "1px solid rgba(245, 158, 11, 0.15)" : "1px solid rgba(16, 185, 129, 0.15)",
            color: isDemo ? "#fbbf24" : "#34d399",
            fontWeight: "500",
            textAlign: "center"
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isDemo ? "#fbbf24" : "#34d399",
              boxShadow: isDemo ? "0 0 8px #fbbf24" : "0 0 8px #34d399"
            }}></span>
            {isDemo ? "Demo Mode (Local Storage)" : "Firebase Connection Active"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500" }}>
              Choose a Nickname
            </label>
            <input
              type="text"
              placeholder="type your nick name here"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-cyber"
              maxLength={20}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Avatar Selector Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500" }}>
              Choose an Avatar
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              padding: "10px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)"
            }}>
              {AVATARS.map((avatar) => (
                <div
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  style={{
                    cursor: "pointer",
                    borderRadius: "50%",
                    padding: "3px",
                    border: selectedAvatar === avatar ? "2px solid var(--color-primary)" : "2px solid transparent",
                    boxShadow: selectedAvatar === avatar ? "var(--shadow-neon)" : "none",
                    transition: "var(--transition-smooth)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.01)"
                  }}
                  className="avatar-select-item"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${avatar}`}
                    alt={avatar}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            className="btn-primary"
            style={{
              justifyContent: "center",
              width: "100%",
              height: "46px"
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entering..." : "Join Chat Room"}
          </button>
        </form>

        {/* Firebase Config Toggle (Optional) - Only visible when in local Demo Mode */}
        {isDemo && (
          <>
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Settings size={12} className={showSettings ? "spin" : ""} />
                Connect Custom Firebase
                {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="glass-panel animate-fade" style={{
                marginTop: "16px",
                padding: "20px",
                background: "rgba(10, 8, 20, 0.4)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)"
          }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={14} color="var(--color-secondary)" />
              Firebase Connection
            </h3>
            
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.4" }}>
              Paste your Firebase credentials to save chat logs in your Firebase Realtime Database using your chosen nickname.
            </p>

            <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input-cyber"
                style={{ fontSize: "0.75rem", padding: "8px 12px" }}
              />
              <input
                type="text"
                placeholder="Auth Domain"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="input-cyber"
                style={{ fontSize: "0.75rem", padding: "8px 12px" }}
              />
              <input
                type="text"
                placeholder="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="input-cyber"
                style={{ fontSize: "0.75rem", padding: "8px 12px" }}
              />
              <input
                type="text"
                placeholder="Storage Bucket"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                className="input-cyber"
                style={{ fontSize: "0.75rem", padding: "8px 12px" }}
              />
              <input
                type="text"
                placeholder="Messaging Sender ID"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                className="input-cyber"
                style={{ fontSize: "0.75rem", padding: "8px 12px" }}
              />
              <input
                type="text"
                placeholder="App ID"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="input-cyber"
                style={{ fontSize: "0.75rem", padding: "8px 12px" }}
              />

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    fontSize: "0.75rem",
                    padding: "8px",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))"
                  }}
                >
                  Save & Connect
                </button>
                {Object.keys(currentConfig).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "8px", borderColor: "rgba(239, 68, 68, 0.4)", color: "#f87171" }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
