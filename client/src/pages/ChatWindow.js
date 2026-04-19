import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, addMessageRealtime } from "../store/massageSlice";
import { useParams } from "react-router-dom";
import socket from "../socket";

function ChatWindow() {

  const { chatId } = useParams();
  const dispatch = useDispatch();

  const { messages, loading } = useSelector((state) => state.chat);

  const [text, setText] = useState("");

  // טעינת הודעות
  useEffect(() => {
    if (chatId) {
      dispatch(fetchMessages(chatId));
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
  const sendMessage = () => {

    if (!text.trim()) return;

    socket.emit("sendMessage", {
      conversationId: chatId,
      content: text
    });

    setText("");

  };

  return (
    <div className="chat-window">

      <div className="messages">

        {loading && <p>Loading...</p>}

        {messages.map((msg) => (
          <div key={msg._id}>
            <strong>{msg.sender?.username}:</strong> {msg.content}
          </div>
        ))}

      </div>

      <div className="input-area">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="הקלד הודעה..."
        />

        <button onClick={sendMessage}>
          שלח
        </button>

      </div>

    </div>
  );
}

export default ChatWindow;