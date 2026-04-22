import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, addMessageRealtime, fetchUserChats } from "../store/massageSlice";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import socket from "../socket";

function ChatWindow() {

  const { chatId } = useParams();
  const dispatch = useDispatch();

  const { messages = [], chats = [], loading = false } = useSelector((state) => state.chat || {});

  const [text, setText] = useState("");
  const token = localStorage.getItem("token");
  const currentUserId = token ? jwtDecode(token).id : null;
  const activeChat = chats.find((chat) => chat._id === chatId);
  const otherParticipant = activeChat?.participants?.find(
    (participant) => participant._id !== currentUserId
  );
  const otherParticipantName = otherParticipant?.username || "המשתמש השני";

  // טעינת הודעות
  useEffect(() => {
    if (chatId) {
      dispatch(fetchMessages(chatId));
      dispatch(fetchUserChats());
    }
  }, [chatId, dispatch]);

  // קבלת הודעה רילטיים
  useEffect(() => {

    const handleReceiveMessage = (message) => {

      if (message.conversation === chatId) {
        dispatch(addMessageRealtime(message));
      }

    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };

  }, [chatId, dispatch]);

  // סימון הודעות כנקראו
  useEffect(() => {
    if (chatId) {
      socket.emit("markAsRead", chatId);
    }
  }, [chatId]);

  // שליחת הודעה
  const sendMessage = async () => {

    if (!text.trim()) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:7500/Forumix/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: chatId,
          content: text
        })
      });

      const message = await res.json();

      if (!res.ok) {
        throw new Error(message?.message || "Failed to send message");
      }

      dispatch(addMessageRealtime(message));
    } catch (err) {
      console.error(err);
      alert("שליחת ההודעה נכשלה");
      return;
    }

    setText("");

  };

  return (
    <section className="chat-layout">
      <div className="chat-header-card">
        <span className="eyebrow">Private Chat</span>
        <h2>{otherParticipantName}</h2>
      </div>

      <div className="messages-panel">
        {loading && <p className="status-text">Loading...</p>}

        {messages.map((msg) => {
          const isMine = String(msg.sender?._id || msg.sender) === String(currentUserId);

          return (
            <div key={msg._id} className={`message-row${isMine ? " mine" : ""}`}>
              <div className={`message-bubble${isMine ? " mine" : ""}`}>
                <strong className="message-label">
                  {isMine ? `To ${otherParticipantName}` : msg.sender?.username || otherParticipantName}
                </strong>
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="composer-inline">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="הקלד הודעה..."
        />

        <button className="primary-button" onClick={sendMessage}>
          שלח
        </button>
      </div>
    </section>
  );
}

export default ChatWindow;
