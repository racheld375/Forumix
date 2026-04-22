import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChats } from "../store/massageSlice";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function MyAccount() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chats = [] } = useSelector((state) => state.chat || {});
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const currentUserId = token ? jwtDecode(token).id : null;

  const [formData, setFormData] = useState({
    username: user?.username || "",
    profession: user?.advancedInfo?.profession || ""
  });

  useEffect(() => {
    dispatch(fetchUserChats());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:7500/Forumix/users/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    alert("הפרטים עודכנו בהצלחה");
  };

  const formatTimestamp = (value) => {
    if (!value) return "";

    const date = new Date(value);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="my-account">
      <h2>האזור האישי</h2>

      {/* עדכון פרטים */}
      <div className="edit-section">
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
        />
        <input
          name="profession"
          value={formData.profession}
          onChange={handleChange}
          placeholder="profession"
        />
        <button onClick={handleUpdate}>
          עדכן פרטים
        </button>
      </div>

      {/* רשימת צ'אטים */}
      <div className="chats-section">
        <div className="chat-list-header">
          <div>
            <h3>הצ'אטים שלי</h3>
            <p>כל השיחות האחרונות שלך במקום אחד</p>
          </div>
          <span className="chat-list-count">{chats.length} chats</span>
        </div>

        {chats.length === 0 ? (
          <div className="chat-empty-state">
            <strong>אין עדיין שיחות</strong>
            <p>ברגע שתתחיל שיחה חדשה, היא תופיע כאן עם הודעות שלא נקראו וזמן שליחה.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const otherParticipant = chat.participants?.find(
              (participant) => participant._id !== currentUserId
            );

            return (
              <button
                key={chat._id}
                type="button"
                className="chat-list-item"
                onClick={() => navigate(`/chat/${chat._id}`)}
              >
                <div className="chat-list-main">
                  <div className="chat-list-topline">
                    <strong className="chat-list-name">
                      {otherParticipant?.username || "צ'אט"}
                    </strong>
                    <span className="chat-list-time">
                      {formatTimestamp(chat.lastMessage?.createdAt || chat.updatedAt)}
                    </span>
                  </div>

                  <p className="chat-list-preview">
                    {chat.lastMessage?.content || "אין עדיין הודעות"}
                  </p>
                </div>

                <div className="chat-list-meta">
                  {chat.unreadCount > 0 && (
                    <span className="chat-list-badge">{chat.unreadCount}</span>
                  )}
                  <span className="chat-list-arrow">Open</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyAccount;
