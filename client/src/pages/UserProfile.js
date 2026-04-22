import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function UserProfile() {

  const { userId } = useParams();
  const navigate = useNavigate();


  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:7500/Forumix/users/${userId}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [userId]);

  if (!user) {
    return <p className="status-text">טוען פרטי משתמש...</p>;
  }

  const startChat = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:7500/Forumix/chat/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      });

      const conversation = await res.json();

      if (!res.ok) {
        throw new Error(conversation?.message || "Failed to open conversation");
      }

      navigate(`/chat/${conversation._id}`);
    } catch (err) {
      console.error(err);
      alert("לא ניתן לפתוח שיחה כרגע");
    }
  };

  return (
    <section className="profile-panel">
      <div className="profile-card">
        <span className="eyebrow">Profile</span>
        <h2>{user.username}</h2>

        <div className="profile-details">
          <div>
            <span className="detail-label">Email</span>
            <p>{user.email || "Not provided"}</p>
          </div>
          <div>
            <span className="detail-label">Profession</span>
            <p>{user.advancedInfo?.profession || "לא צוין"}</p>
          </div>
          <div>
            <span className="detail-label">City</span>
            <p>{user.city || "Not provided"}</p>
          </div>
        </div>

        <button className="primary-button" onClick={startChat}>
          שלח הודעה
        </button>
      </div>
    </section>
  );
}

export default UserProfile;
