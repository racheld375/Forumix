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
    return <p>טוען פרטי משתמש...</p>;
  }

  const startChat = () => {
    navigate(`/chat/${user._id}`);
  };

  return (
    <div className="user-profile">

      <h2>{user.username}</h2>

      <p>Email: {user.email}</p>

      <p>
        Profession: {user.advancedInfo?.profession || "לא צוין"}
      </p>

      <button onClick={startChat}>
        שלח הודעה
      </button>

    </div>
  );
}

export default UserProfile;