import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, logout } from "../store/authSlice";
import { fetchTopics } from "../store/topicsSlice";
import socket from "../socket";

const API_BASE = "http://localhost:7500/Forumix";

const emptyCategory = { title: "" };
const emptyDiscussion = { title: "", topic: "", category: "", creator: "" };
const emptyComment = { content: "", discussion: "" };

function getMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

export default function AdminPage() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [categories, setCategories] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);

  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [discussionForm, setDiscussionForm] = useState(emptyDiscussion);
  const [editingDiscussionId, setEditingDiscussionId] = useState(null);

  const [commentForm, setCommentForm] = useState(emptyComment);
  const [editingCommentId, setEditingCommentId] = useState(null);

  const adminHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadAdminData = async () => {
    setLoading(true);
    setStatus("");

    const requests = [
      ["categories", `${API_BASE}/category`],
      ["discussions", `${API_BASE}/discussions`],
      ["comments", `${API_BASE}/comment`],
      ["users", `${API_BASE}/users`],
      ["proposals", `${API_BASE}/discussion-proposals/pending`]
    ];

    const results = await Promise.all(
      requests.map(async ([key, url]) => {
        try {
          const headers = key === "proposals" ? { Authorization: `Bearer ${token}` } : undefined;
          const response = await fetch(url, { headers });
          const data = await response.json();

          if (!response.ok) {
            return { key, error: getMessage(data, "שגיאה בטעינת נתונים") };
          }

          return { key, data };
        } catch (err) {
          return { key, error: err.message || "שגיאה בטעינת נתונים" };
        }
      })
    );

    const errors = [];

    results.forEach((result) => {
      if (result.error) {
        errors.push(result.error);
        return;
      }

      if (result.key === "categories") {
        setCategories(Array.isArray(result.data) ? result.data : []);
      }

      if (result.key === "discussions") {
        setDiscussions(Array.isArray(result.data) ? result.data : []);
      }

      if (result.key === "comments") {
        setComments(Array.isArray(result.data?.comments) ? result.data.comments : []);
      }

      if (result.key === "users") {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }

      if (result.key === "proposals") {
        setProposals(Array.isArray(result.data) ? result.data : []);
      }
    });

    if (errors.length > 0) {
      setStatus(`חלק מהנתונים לא נטענו: ${errors.join(" | ")}`);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const handleProposalCreated = () => {
      loadAdminData();
    };

    socket.on("discussionProposalCreated", handleProposalCreated);

    return () => {
      socket.off("discussionProposalCreated", handleProposalCreated);
    };
  }, [isAdmin]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getMessage(data, "שם משתמש או סיסמה שגויים"));
      }

      const decoded = jwtDecode(data.token);

      if (decoded.role !== "admin") {
        localStorage.removeItem("token");
        throw new Error("רק משתמש עם הרשאת admin יכול להיכנס לממשק הזה");
      }

      dispatch(loginSuccess({ token: data.token, user: decoded }));
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      setLoginError(err.message || "שגיאה בהתחברות מנהל");
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const url = editingCategoryId
      ? `${API_BASE}/category/${editingCategoryId}`
      : `${API_BASE}/category`;

    const response = await fetch(url, {
      method: editingCategoryId ? "PUT" : "POST",
      headers: adminHeaders,
      body: JSON.stringify(categoryForm)
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה בשמירת קטגוריה"));
      return;
    }

    setCategoryForm(emptyCategory);
    setEditingCategoryId(null);
    setStatus("הקטגוריה נשמרה בהצלחה");
    await loadAdminData();
    dispatch(fetchTopics());
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("למחוק את הקטגוריה?")) return;

    const response = await fetch(`${API_BASE}/category/${id}`, {
      method: "DELETE",
      headers: adminHeaders
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה במחיקת קטגוריה"));
      return;
    }

    setStatus("הקטגוריה נמחקה");
    await loadAdminData();
    dispatch(fetchTopics());
  };

  const saveDiscussion = async (event) => {
    event.preventDefault();
    const payload = {
      title: discussionForm.title,
      topic: discussionForm.topic,
      category: discussionForm.category,
      creator: discussionForm.creator || user?.id
    };
    const url = editingDiscussionId
      ? `${API_BASE}/discussions/${editingDiscussionId}`
      : `${API_BASE}/discussions`;

    const response = await fetch(url, {
      method: editingDiscussionId ? "PUT" : "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה בשמירת דיון"));
      return;
    }

    setDiscussionForm(emptyDiscussion);
    setEditingDiscussionId(null);
    setStatus("הדיון נשמר בהצלחה");
    await loadAdminData();
  };

  const deleteDiscussion = async (id) => {
    if (!window.confirm("למחוק את הדיון?")) return;

    const response = await fetch(`${API_BASE}/discussions/${id}`, {
      method: "DELETE",
      headers: adminHeaders
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה במחיקת דיון"));
      return;
    }

    setStatus("הדיון נמחק");
    await loadAdminData();
  };

  const saveComment = async (event) => {
    event.preventDefault();
    const url = editingCommentId
      ? `${API_BASE}/comment/${editingCommentId}`
      : `${API_BASE}/comment`;

    const response = await fetch(url, {
      method: editingCommentId ? "PUT" : "POST",
      headers: adminHeaders,
      body: JSON.stringify(commentForm)
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה בשמירת תגובה"));
      return;
    }

    setCommentForm(emptyComment);
    setEditingCommentId(null);
    setStatus("התגובה נשמרה בהצלחה");
    await loadAdminData();
  };

  const deleteComment = async (id) => {
    if (!window.confirm("למחוק את התגובה?")) return;

    const response = await fetch(`${API_BASE}/comment/${id}`, {
      method: "DELETE",
      headers: adminHeaders
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה במחיקת תגובה"));
      return;
    }

    setStatus("התגובה נמחקה");
    await loadAdminData();
  };

  const approveProposal = async (id) => {
    const response = await fetch(`${API_BASE}/discussion-proposals/${id}/approve`, {
      method: "POST",
      headers: adminHeaders
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה באישור הצעת דיון"));
      return;
    }

    setStatus("הצעת הדיון אושרה ונשלחה הודעה למשתמש");
    await loadAdminData();
    dispatch(fetchTopics());
  };

  const rejectProposal = async (id) => {
    if (!window.confirm("למחוק את הצעת הדיון?")) return;

    const response = await fetch(`${API_BASE}/discussion-proposals/${id}`, {
      method: "DELETE",
      headers: adminHeaders
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(getMessage(data, "שגיאה במחיקת הצעת דיון"));
      return;
    }

    setStatus("הצעת הדיון נמחקה ונשלחה הודעה למשתמש");
    await loadAdminData();
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({ title: category.title || "" });
  };

  const startEditDiscussion = (discussion) => {
    setEditingDiscussionId(discussion._id);
    setDiscussionForm({
      title: discussion.title || "",
      topic: discussion.topic || "",
      category: discussion.category?._id || discussion.category || "",
      creator: discussion.creator?._id || discussion.creator || user?.id || ""
    });
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setCommentForm({
      content: comment.content || "",
      discussion: comment.discussion?._id || comment.discussion || ""
    });
  };

  if (!isAdmin) {
    return (
      <section className="auth-page">
        <form className="auth-card" onSubmit={handleAdminLogin}>
          <span className="eyebrow">Admin Login</span>
          <h2>כניסת מנהל</h2>
          <p>רק משתמש שההרשאה שלו היא admin יכול להיכנס לממשק הניהול.</p>

          <input
            value={loginForm.username}
            onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
            placeholder="Username"
          />
          <input
            value={loginForm.password}
            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            type="password"
            placeholder="Password"
          />
          <button type="submit" className="primary-button">כניסה למנהל</button>

          {loginError && <p className="status-text">{loginError}</p>}
          {user && user.role !== "admin" && (
            <button type="button" className="text-button" onClick={() => dispatch(logout())}>
              לצאת מהמשתמש הנוכחי ולהתחבר כמנהל
            </button>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className="content-panel admin-page">
      <div className="section-header">
        <div>
          <span className="eyebrow">Admin Dashboard</span>
          <h2>ניהול Forumix</h2>
          <p className="section-intro">
            כאן אפשר לראות את הקטגוריות, הדיונים והתגובות כמו משתמש רגיל, ובנוסף ליצור, לערוך ולמחוק אותם.
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={loadAdminData}>
          רענון
        </button>
      </div>

      {loading && <p className="status-text">טוען נתוני ניהול...</p>}
      {status && <p className="status-text">{status}</p>}

      <div className="admin-stats-grid">
        <div className="summary-meta-card">
          <strong>קטגוריות</strong>
          <p>{categories.length}</p>
        </div>
        <div className="summary-meta-card">
          <strong>דיונים</strong>
          <p>{discussions.length}</p>
        </div>
        <div className="summary-meta-card">
          <strong>תגובות</strong>
          <p>{comments.length}</p>
        </div>
        <div className="summary-meta-card">
          <strong>הצעות לאישור</strong>
          <p>{proposals.length}</p>
        </div>
      </div>

      <section className="summary-panel">
        <div className="summary-toolbar">
          <div>
            <span className="eyebrow">New Discussions</span>
            <h3>דיונים חדשים לאישור</h3>
          </div>
        </div>

        {proposals.length === 0 ? (
          <p className="status-text">אין הצעות דיון שממתינות לאישור.</p>
        ) : (
          <div className="admin-table">
            {proposals.map((proposal) => (
              <article key={proposal._id} className="admin-row">
                <div>
                  <strong>{proposal.title}</strong>
                  <p className="preserve-line-breaks">{proposal.topic || proposal.note}</p>
                  <p>
                    קטגוריה: {proposal.category?.title || "ללא קטגוריה"} | שולח:
                    {" "}{proposal.requester?.username || "משתמש"}
                    {proposal.requester?.city ? `, ${proposal.requester.city}` : ""}
                  </p>
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="primary-button" onClick={() => approveProposal(proposal._id)}>
                    אישור
                  </button>
                  <button type="button" className="ghost-button danger-button" onClick={() => rejectProposal(proposal._id)}>
                    מחיקה
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="summary-panel">
        <div className="summary-toolbar">
          <div>
            <span className="eyebrow">Categories</span>
            <h3>קטגוריות</h3>
          </div>
        </div>

        <form className="admin-form-grid" onSubmit={saveCategory}>
          <input
            value={categoryForm.title}
            onChange={(event) => setCategoryForm({ title: event.target.value })}
            placeholder="שם קטגוריה"
            required
          />
          <button type="submit" className="primary-button">
            {editingCategoryId ? "עדכון קטגוריה" : "יצירת קטגוריה"}
          </button>
          {editingCategoryId && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setEditingCategoryId(null);
                setCategoryForm(emptyCategory);
              }}
            >
              ביטול
            </button>
          )}
        </form>

        <div className="admin-table">
          {categories.map((category) => (
            <article key={category._id} className="admin-row">
              {editingCategoryId === category._id ? (
                <form className="admin-inline-edit" onSubmit={saveCategory}>
                  <input
                    value={categoryForm.title}
                    onChange={(event) => setCategoryForm({ title: event.target.value })}
                    placeholder="שם קטגוריה"
                    required
                    autoFocus
                  />
                  <div className="admin-row-actions">
                    <button type="submit" className="primary-button">שמירה</button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryForm(emptyCategory);
                      }}
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="admin-row-content">
                    <strong>{category.title}</strong>
                    <p>{category.discussions?.length || 0} דיונים</p>
                  </div>
                  <div className="admin-row-actions">
                    <NavLink className="inline-link" to={`/topic/${category._id}`}>פתיחה</NavLink>
                    <button type="button" className="ghost-button" onClick={() => startEditCategory(category)}>עריכה</button>
                    <button type="button" className="ghost-button danger-button" onClick={() => deleteCategory(category._id)}>מחיקה</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="summary-panel">
        <div className="summary-toolbar">
          <div>
            <span className="eyebrow">Discussions</span>
            <h3>דיונים</h3>
          </div>
        </div>

        <form className="admin-form-grid admin-form-grid-wide" onSubmit={saveDiscussion}>
          <input
            value={discussionForm.title}
            onChange={(event) => setDiscussionForm({ ...discussionForm, title: event.target.value })}
            placeholder="כותרת דיון"
            required
          />
          <input
            value={discussionForm.topic}
            onChange={(event) => setDiscussionForm({ ...discussionForm, topic: event.target.value })}
            placeholder="תוכן / נושא הדיון"
            required
          />
          <select
            value={discussionForm.category}
            onChange={(event) => setDiscussionForm({ ...discussionForm, category: event.target.value })}
            required
          >
            <option value="">בחירת קטגוריה</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.title}</option>
            ))}
          </select>
          <select
            value={discussionForm.creator}
            onChange={(event) => setDiscussionForm({ ...discussionForm, creator: event.target.value })}
          >
            <option value="">יוצר: המנהל המחובר</option>
            {users.map((item) => (
              <option key={item._id} value={item._id}>{item.username}</option>
            ))}
          </select>
          <button type="submit" className="primary-button">
            {editingDiscussionId ? "עדכון דיון" : "יצירת דיון"}
          </button>
          {editingDiscussionId && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setEditingDiscussionId(null);
                setDiscussionForm(emptyDiscussion);
              }}
            >
              ביטול
            </button>
          )}
        </form>

        <div className="admin-table">
          {discussions.map((discussion) => (
            <article key={discussion._id} className="admin-row">
              {editingDiscussionId === discussion._id ? (
                <form className="admin-inline-edit admin-inline-edit-wide" onSubmit={saveDiscussion}>
                  <input
                    value={discussionForm.title}
                    onChange={(event) => setDiscussionForm({ ...discussionForm, title: event.target.value })}
                    placeholder="כותרת דיון"
                    required
                    autoFocus
                  />
                  <textarea
                    value={discussionForm.topic}
                    onChange={(event) => setDiscussionForm({ ...discussionForm, topic: event.target.value })}
                    placeholder="תוכן / נושא הדיון"
                    required
                  />
                  <select
                    value={discussionForm.category}
                    onChange={(event) => setDiscussionForm({ ...discussionForm, category: event.target.value })}
                    required
                  >
                    <option value="">בחירת קטגוריה</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.title}</option>
                    ))}
                  </select>
                  <div className="admin-row-actions">
                    <button type="submit" className="primary-button">שמירה</button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingDiscussionId(null);
                        setDiscussionForm(emptyDiscussion);
                      }}
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="admin-row-content">
                    <strong>{discussion.title}</strong>
                    <p>{discussion.topic}</p>
                    <p>{discussion.category?.title || "ללא קטגוריה"} | {discussion.creator?.username || "ללא יוצר"}</p>
                  </div>
                  <div className="admin-row-actions">
                    <NavLink className="inline-link" to={`/discussion/${discussion._id}`}>פתיחה</NavLink>
                    <button type="button" className="ghost-button" onClick={() => startEditDiscussion(discussion)}>עריכה</button>
                    <button type="button" className="ghost-button danger-button" onClick={() => deleteDiscussion(discussion._id)}>מחיקה</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="summary-panel">
        <div className="summary-toolbar">
          <div>
            <span className="eyebrow">Comments</span>
            <h3>תגובות</h3>
          </div>
        </div>

        <form className="admin-form-grid admin-form-grid-wide" onSubmit={saveComment}>
          <textarea
            value={commentForm.content}
            onChange={(event) => setCommentForm({ ...commentForm, content: event.target.value })}
            placeholder="תוכן תגובה"
            required
          />
          <select
            value={commentForm.discussion}
            onChange={(event) => setCommentForm({ ...commentForm, discussion: event.target.value })}
            required={!editingCommentId}
            disabled={Boolean(editingCommentId)}
          >
            <option value="">בחירת דיון</option>
            {discussions.map((discussion) => (
              <option key={discussion._id} value={discussion._id}>{discussion.title}</option>
            ))}
          </select>
          <button type="submit" className="primary-button">
            {editingCommentId ? "עדכון תגובה" : "יצירת תגובה"}
          </button>
          {editingCommentId && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setEditingCommentId(null);
                setCommentForm(emptyComment);
              }}
            >
              ביטול
            </button>
          )}
        </form>

        <div className="admin-table">
          {comments.map((comment) => (
            <article key={comment._id} className="admin-row">
              {editingCommentId === comment._id ? (
                <form className="admin-inline-edit admin-inline-edit-comment" onSubmit={saveComment}>
                  <textarea
                    value={commentForm.content}
                    onChange={(event) => setCommentForm({ ...commentForm, content: event.target.value })}
                    placeholder="תוכן תגובה"
                    required
                    autoFocus
                  />
                  <div className="admin-row-actions">
                    <button type="submit" className="primary-button">שמירה</button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingCommentId(null);
                        setCommentForm(emptyComment);
                      }}
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="admin-row-content">
                    <strong>{comment.user?.username || "משתמש"}</strong>
                    <p className="preserve-line-breaks">{comment.content}</p>
                    <p>{comment.discussion?.topic || "דיון"}</p>
                  </div>
                  <div className="admin-row-actions">
                    {comment.discussion?._id && (
                      <NavLink className="inline-link" to={`/discussion/${comment.discussion._id}`}>פתיחה</NavLink>
                    )}
                    <button type="button" className="ghost-button" onClick={() => startEditComment(comment)}>עריכה</button>
                    <button type="button" className="ghost-button danger-button" onClick={() => deleteComment(comment._id)}>מחיקה</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
