import React, { useState, useEffect } from "react";
import { chatService } from "./firebase";
import Auth from "./components/Auth";
import Chat from "./components/Chat";
import { MessageSquare } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to Authentication state updates
  useEffect(() => {
    const unsubscribe = chatService.subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "var(--bg-main)",
        fontFamily: "var(--font-display)",
      }}>
        <div style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-neon)",
          marginBottom: "20px",
          animation: "loading-pulse 1.5s infinite ease-in-out"
        }}>
          <MessageSquare size={32} color="#fff" />
        </div>
        <h2 style={{ fontSize: "1.25rem", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "600" }}>
          ESTABLISHING SECURE CONNECTION
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "8px" }}>
          Initializing Chattiko Engine...
        </p>

        <style>{`
          @keyframes loading-pulse {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.1); filter: brightness(1.2); box-shadow: 0 0 35px rgba(139, 92, 246, 0.4); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <Auth onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
      ) : (
        <Chat user={user} onSignOut={() => setUser(null)} />
      )}
    </>
  );
}
