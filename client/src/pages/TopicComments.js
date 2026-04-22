import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCommentsByDiscussion,
  clearComments
} from "../store/commentSlice";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { createComment } from "../store/commentSlice";

export default function TopicComments() {
  const navigate = useNavigate();
  const { discussionId } = useParams();
  const dispatch = useDispatch();

  const { items, loading, error } = useSelector(
    (state) => state.comments
  );
  const [newComment, setNewComment] = useState("");

const { user } = useSelector((state) => state.auth || {});
  useEffect(() => {
    dispatch(fetchCommentsByDiscussion(discussionId))
      .unwrap()
      .catch((err) => {
        if (err.status === 401) navigate("/login");
        else if (err.status === 403) alert("אין הרשאה");
      });

    return () => dispatch(clearComments());
  }, [dispatch, discussionId, navigate]);
const handleAddComment = () => {
  if (!newComment.trim()) return;

  dispatch(
    createComment({
      content: newComment,
      discussion: discussionId,
    })
  )
    .unwrap()
    .then(() => {
      setNewComment("");
    })
.catch((err) => {
  console.log("ERROR:", err); // 👈 חשוב!

  if (err?.status === 401) {
    navigate("/login");
  } else if (err?.status === 403) {
    alert("אין הרשאה");
  } else {
    alert("שגיאה ביצירת תגובה"+localStorage.getItem("token"));
  }
});
};
  return (
    <section className="content-panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Discussion Flow</span>
          <h2>תגובות</h2>
        </div>
      </div>

      

      {loading && <p className="status-text">טוען תגובות...</p>}
      {error && <p className="status-text">שגיאה בטעינת תגובות.</p>}

      {items?.length === 0 && !loading && <p className="status-text">אין תגובות לדיון זה</p>}

      <div className="comment-stack">
        {items?.map((comment) => ( 
          <article key={comment._id} className="comment-card">
            <p className="comment-body">{comment.content}</p>
            <div className="comment-meta">
              <NavLink className="inline-link" to={`/user/${comment.user._id}`}>
                {comment.user.username}
              </NavLink>
              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
          </article>
        ))}
      </div>
      {user ? (
        <div className="composer-card">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="כתוב תגובה..."
          />
          <button className="primary-button" onClick={handleAddComment}>הוסף תגובה</button>
        </div>
      ) : (
        <p className="status-text">
          כדי להגיב יש <NavLink className="inline-link" to="/login">להתחבר</NavLink>
        </p>
      )}
    </section>
  );
}
