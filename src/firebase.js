import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, push, set, onValue, off, remove, serverTimestamp } from "firebase/database";

// Helper to check if a config is valid
const isValidConfig = (config) => {
  return (
    config &&
    config.apiKey &&
    config.apiKey !== "YOUR_API_KEY" &&
    config.projectId &&
    config.authDomain
  );
};

// Get config from localStorage or env
const getFirebaseConfig = () => {
  try {
    const localConfig = localStorage.getItem("firebase_config");
    if (localConfig) {
      const parsed = JSON.parse(localConfig);
      if (isValidConfig(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading firebase_config from localStorage:", e);
  }

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (isValidConfig(envConfig)) return envConfig;
  return null;
};

const config = getFirebaseConfig();
let dbInstance = null;
let isDemoMode = true;

if (config) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    dbInstance = getDatabase(app);
    isDemoMode = false;
    console.log("Firebase Realtime Database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Realtime Database, falling back to Demo Mode:", error);
    isDemoMode = true;
  }
} else {
  console.log("No Firebase config found. Running in Demo Mode (Mock Backend).");
}

// ==========================================
// MOCK BACKEND ENGINE FOR DEMO MODE
// ==========================================

// Predefined Rooms
const PREDEFINED_ROOMS = ["general", "tech-talk", "gaming-lounge", "random-ideas"];

const getMockRooms = () => {
  const rooms = localStorage.getItem("mock_rooms");
  if (!rooms) {
    localStorage.setItem("mock_rooms", JSON.stringify(PREDEFINED_ROOMS));
    return PREDEFINED_ROOMS;
  }
  return JSON.parse(rooms);
};

const getMockMessages = (room) => {
  const messages = localStorage.getItem(`mock_messages_${room}`);
  if (!messages) {
    localStorage.setItem(`mock_messages_${room}`, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(messages);
    const filtered = parsed.filter(m => m.uid !== "system" && m.displayName !== "System Bot");
    if (filtered.length !== parsed.length) {
      localStorage.setItem(`mock_messages_${room}`, JSON.stringify(filtered));
    }
    return filtered;
  } catch (e) {
    return [];
  }
};

const mockRoomListeners = [];
const mockMessageListeners = {};

// Multi-tab sync using storage events
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("mock_messages_")) {
      const room = e.key.replace("mock_messages_", "");
      if (mockMessageListeners[room]) {
        const msgs = JSON.parse(e.newValue || "[]");
        mockMessageListeners[room].forEach((cb) => cb(msgs));
      }
    }
    if (e.key === "mock_rooms" && mockRoomListeners.length > 0) {
      const rooms = JSON.parse(e.newValue || "[]");
      mockRoomListeners.forEach((cb) => cb(rooms));
    }
  });
}

// Unified API Wrapper (pure Nickname Auth with Realtime Database)
export const chatService = {
  isDemoMode: () => isDemoMode,

  getFirebaseConfig: () => config,

  setFirebaseConfig: (newConfig) => {
    if (!newConfig) {
      localStorage.removeItem("firebase_config");
    } else {
      localStorage.setItem("firebase_config", JSON.stringify(newConfig));
    }
    window.location.reload();
  },

  clearFirebaseConfig: () => {
    localStorage.removeItem("firebase_config");
    window.location.reload();
  },

  // Pure Local Storage User Auth State
  subscribeToAuth: (callback) => {
    const checkUser = () => {
      const userStr = localStorage.getItem("chat_user");
      if (userStr) {
        callback(JSON.parse(userStr));
      } else {
        callback(null);
      }
    };
    
    checkUser();

    const handler = (e) => {
      if (e.key === "chat_user") {
        checkUser();
      }
    };
    window.addEventListener("storage", handler);
    
    return () => {
      window.removeEventListener("storage", handler);
    };
  },

  signIn: async (username, avatarSeed) => {
    const cleanName = username.trim() || "User";
    const seed = avatarSeed || cleanName;
    const user = {
      uid: `user-${cleanName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
    };
    localStorage.setItem("chat_user", JSON.stringify(user));
    window.dispatchEvent(new StorageEvent("storage", { key: "chat_user", newValue: JSON.stringify(user) }));
    return user;
  },

  signOut: async () => {
    localStorage.removeItem("chat_user");
    window.dispatchEvent(new StorageEvent("storage", { key: "chat_user", newValue: null }));
  },

  // Rooms Operations (Realtime DB implementation)
  subscribeToRooms: (callback) => {
    if (!isDemoMode && dbInstance) {
      const roomsRef = ref(dbInstance, "rooms");
      onValue(roomsRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          // Firebase RTDB returns room objects
          const list = Object.values(val).map(roomObj => roomObj.name);
          callback(list.length > 0 ? list : PREDEFINED_ROOMS);
        } else {
          callback(PREDEFINED_ROOMS);
        }
      }, (err) => {
        console.error("Realtime DB rooms subscription error, using defaults:", err);
        callback(PREDEFINED_ROOMS);
      });

      return () => off(roomsRef);
    } else {
      const rooms = getMockRooms();
      callback(rooms);
      mockRoomListeners.push(callback);
      return () => {
        const idx = mockRoomListeners.indexOf(callback);
        if (idx !== -1) mockRoomListeners.splice(idx, 1);
      };
    }
  },

  createRoom: async (roomName) => {
    const cleanRoom = roomName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!cleanRoom) throw new Error("Invalid room name");

    if (!isDemoMode && dbInstance) {
      const roomsRef = ref(dbInstance, "rooms");
      const newRoomRef = push(roomsRef);
      await set(newRoomRef, {
        name: cleanRoom,
        createdAt: serverTimestamp()
      });
    } else {
      const rooms = getMockRooms();
      if (!rooms.includes(cleanRoom)) {
        rooms.push(cleanRoom);
        localStorage.setItem("mock_rooms", JSON.stringify(rooms));
        window.dispatchEvent(new StorageEvent("storage", { key: "mock_rooms", newValue: JSON.stringify(rooms) }));
        mockRoomListeners.forEach((cb) => cb(rooms));
      }
    }
    return cleanRoom;
  },

  // Messages Operations (Realtime DB implementation)
  subscribeToMessages: (room, callback) => {
    if (!isDemoMode && dbInstance) {
      const messagesRef = ref(dbInstance, `messages_${room}`);
      onValue(messagesRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const list = Object.keys(val).map(key => ({
            id: key,
            ...val[key],
            createdAt: val[key].createdAt ? new Date(val[key].createdAt).toISOString() : new Date().toISOString()
          }));
          callback(list);
        } else {
          callback([]);
        }
      });

      return () => off(messagesRef);
    } else {
      const msgs = getMockMessages(room);
      callback(msgs);

      if (!mockMessageListeners[room]) {
        mockMessageListeners[room] = [];
      }
      mockMessageListeners[room].push(callback);

      return () => {
        mockMessageListeners[room] = mockMessageListeners[room].filter((cb) => cb !== callback);
      };
    }
  },

  sendMessage: async (room, text, user) => {
    if (!text.trim()) return;

    if (!isDemoMode && dbInstance) {
      const messagesRef = ref(dbInstance, `messages_${room}`);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, {
        text: text.trim(),
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } else {
      const msgs = getMockMessages(room);
      const newMsg = {
        id: `mock-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      msgs.push(newMsg);
      if (msgs.length > 200) msgs.shift();

      localStorage.setItem(`mock_messages_${room}`, JSON.stringify(msgs));
      
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: `mock_messages_${room}`,
          newValue: JSON.stringify(msgs),
        })
      );
      
      if (mockMessageListeners[room]) {
        mockMessageListeners[room].forEach((cb) => cb(msgs));
      }
    }
  },

  deleteMessage: async (room, messageId) => {
    if (isDemoMode) {
      const msgs = getMockMessages(room);
      const updatedMsgs = msgs.filter((msg) => msg.id !== messageId);
      localStorage.setItem(`mock_messages_${room}`, JSON.stringify(updatedMsgs));
      
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: `mock_messages_${room}`,
          newValue: JSON.stringify(updatedMsgs),
        })
      );
      
      if (mockMessageListeners[room]) {
        mockMessageListeners[room].forEach((cb) => cb(updatedMsgs));
      }
    } else {
      if (!isDemoMode && dbInstance) {
        await remove(ref(dbInstance, `messages_${room}/${messageId}`));
      }
    }
  }
};
