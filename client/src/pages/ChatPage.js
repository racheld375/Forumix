import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserChats,
  fetchMessages,
  addMessageRealtime
} from "../store/massageSlice";
import { io } from "socket.io-client";

const socket = io("http://localhost:7500", {
  auth: {
    token: localStorage.getItem("token")
  }
});

function ChatPage() {
  const dispatch = useDispatch();
  const { chats, messages, loading } = useSelector((state) => state.chat);

  /* =========================
     📥 טעינת רשימת שיחות
  ========================== */
  useEffect(() => {
    dispatch(fetchUserChats());
  }, [dispatch]);

  /* =========================
     📡 רילטיים
  ========================== */
  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      dispatch(addMessageRealtime(message));
    });

    return () => socket.off("receiveMessage");
  }, [dispatch]);

  /* =========================
     🎯 פתיחת שיחה
  ========================== */
  const openChat = (chatId) => {
    dispatch(fetchMessages(chatId));
  };

  return (
    <div style={{ display: "flex" }}>
      {/* רשימת שיחות */}
      <div style={{ width: "30%" }}>
        <h3>Chats</h3>
        {chats.map((chat) => (
          <div key={chat._id} onClick={() => openChat(chat._id)}>
            {chat._id}
          </div>
        ))}
      </div>

      {/* הודעות */}
      <div style={{ width: "70%" }}>
        <h3>Messages</h3>
        {loading && <p>Loading...</p>}
        {messages.map((msg) => (
          <div key={msg._id}>
            <strong>{msg.sender?.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatPage;