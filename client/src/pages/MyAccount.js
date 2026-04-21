import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserChats } from "../store/massageSlice";
import { useNavigate } from "react-router-dom";

function MyAccount() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chats } = useSelector((state) => state.chat);
  const user = JSON.parse(localStorage.getItem("user"));

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
        <h3>הצ'אטים שלי</h3>
        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => navigate(`/chat/${chat._id}`)}
            style={{ cursor: "pointer" }}
          >
            צ'אט #{chat._id}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyAccount;