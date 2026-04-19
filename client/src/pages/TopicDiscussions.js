
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDiscussionsByTopic,
  clearDiscussions
} from "../store/discussionsSlice";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";

export default function TopicDiscussions() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(
    (state) => state.discussions
  );

  useEffect(() => {
  dispatch(fetchDiscussionsByTopic(topicId))
    .unwrap()
    .catch(err => {
      if (err.status === 401) navigate("/login");
      // else if (response.status === 401) navigate("/register");
      else if (err.status === 403) alert("אין הרשאה");
    });

  return () => dispatch(clearDiscussions());
}, [dispatch, topicId, navigate]);
  return (
    <div>
      <h2>דיונים  </h2>

      {loading && <p>טוען דיונים...</p>}
      {/* {error && <p>שגיאה: {error}</p>} */}

      {items.length === 0 && !loading && <p>אין דיונים בנושא זה</p>}

      {items.map((discussion) => (
        <div key={discussion._id} style={{ marginBottom: "20px" }}>
          <h3>{discussion.title}</h3>
          <NavLink key={discussion._id} to={`/discussion/${discussion._id}`}>
              {discussion.topic}
          </NavLink>
          <p> תגובות {discussion.commentsCount}</p>
        </div>
      ))}
    </div>
  );
}
