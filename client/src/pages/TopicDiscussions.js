
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
    <section className="content-panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Topic Discussions</span>
          <h2>Follow the active threads</h2>
        </div>
      </div>

      {loading && <p className="status-text">טוען דיונים...</p>}
      {error && <p className="status-text">אירעה שגיאה בטעינת הדיונים.</p>}

      {items.length === 0 && !loading && <p className="status-text">אין דיונים בנושא זה</p>}

      <div className="card-grid">
        {items.map((discussion) => (
          <article key={discussion._id} className="discussion-card">
            <span className="mini-tag">{discussion.commentsCount || 0} comments</span>
            <h3>{discussion.title}</h3>
            <p>{discussion.topic}</p>
            <NavLink className="inline-link" to={`/discussion/${discussion._id}`}>
              Open discussion
            </NavLink>
          </article>
        ))}
      </div>
    </section>
  );
}
