
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDiscussionsByTopic,
  clearDiscussions
} from "../store/discussionsSlice";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import socket from "../socket";

export default function TopicDiscussions() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, loading, error } = useSelector(
    (state) => state.discussions
  );
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({ title: "", topic: "" });
  const [proposalStatus, setProposalStatus] = useState("");

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

  useEffect(() => {
    const handleDiscussionApproved = (payload) => {
      if (payload?.categoryId === topicId) {
        dispatch(fetchDiscussionsByTopic(topicId));
      }
    };

    socket.on("discussionApproved", handleDiscussionApproved);

    return () => {
      socket.off("discussionApproved", handleDiscussionApproved);
    };
  }, [dispatch, topicId]);

  const handleSubmitProposal = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:7500/Forumix/discussion-proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: proposalForm.title,
          topic: proposalForm.topic,
          category: topicId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "שגיאה בשליחת הצעת דיון");
      }

      setProposalForm({ title: "", topic: "" });
      setShowProposalForm(false);
      setProposalStatus("הצעת הדיון נשלחה למנהל לאישור");
    } catch (err) {
      setProposalStatus(err.message || "שגיאה בשליחת הצעת דיון");
    }
  };

  return (
    <section className="content-panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Topic Discussions</span>
          <h3>הצעה לדיון חדש</h3>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (!user) {
              navigate("/login");
              return;
            }

            setShowProposalForm((current) => !current);
          }}
        >
          דיון חדש
        </button>
      </div>

      {showProposalForm && (
        <form className="composer-card discussion-proposal-form" onSubmit={handleSubmitProposal}>
          <input
            value={proposalForm.title}
            onChange={(event) => setProposalForm({ ...proposalForm, title: event.target.value })}
            placeholder="שם הדיון"
            required
          />
          <textarea
            value={proposalForm.topic}
            onChange={(event) => setProposalForm({ ...proposalForm, topic: event.target.value })}
            placeholder="תוכן"
            required
          />
          <button type="submit" className="primary-button">
            שליחת הצעה לאישור
          </button>
        </form>
      )}

      {proposalStatus && <p className="status-text">{proposalStatus}</p>}

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
