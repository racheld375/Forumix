import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCommentsByDiscussion,
  clearComments
} from "../store/commentSlice";
import { NavLink } from "react-router-dom";
export default function TopicComments() {
  const navigate = useNavigate();
  const { discussionId } = useParams();
  const dispatch = useDispatch();

  const { items, loading, error } = useSelector(
    (state) => state.comments
  );

  useEffect(() => {
    dispatch(fetchCommentsByDiscussion(discussionId))
      .unwrap()
      .catch((err) => {
        if (err.status === 401) navigate("/login");
        else if (err.status === 403) alert("אין הרשאה");
      });

    return () => dispatch(clearComments());
  }, [dispatch, discussionId, navigate]);

  return (
    <div>

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
