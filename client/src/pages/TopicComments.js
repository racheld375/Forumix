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
    <div>

{user ? (
  <div>
    <textarea
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="כתוב תגובה..."
    />
    <br />
    <button onClick={handleAddComment}>הוסף תגובה</button>
  </div>
) : (
  <p>
    כדי להגיב יש <NavLink to="/login">להתחבר</NavLink>
  </p>
)}

      <h2>תגובות</h2>

      {loading && <p>טוען תגובות...</p>}
      {error && <p>שגיאה: {error}</p>}

{items?.length === 0 && !loading && <p>אין תגובות לדיון זה</p>}

{items?.map((comment) => ( 

        <div key={comment._id}>
          <p>{comment.content}</p>
          <span>
 
             הגיב/ה  בתאריך {" "}
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        
          <NavLink key={comment._id} to={`/user/${comment.user._id}`}>
              {comment.user.username}
          </NavLink>



        </div>
      ))}
    </div>
  );
}
