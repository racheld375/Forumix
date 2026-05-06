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

const STOP_WORDS = new Set([
  "the", "and", "that", "with", "this", "from", "have", "were", "about", "your",
  "של", "את", "עם", "על", "זה", "זאת", "היא", "הוא", "אני", "אתה", "אתם", "אבל",
  "יש", "אין", "הדיון", "תגובה", "כדי", "מה", "איך", "כי", "גם", "עוד", "כאן"
]);

function extractThemes(discussion, comments) {
  const sourceText = [discussion?.title, discussion?.topic, ...comments.map((comment) => comment.content)]
    .filter(Boolean)
    .join(" ");

  const words = sourceText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const counts = new Map();

  words.forEach((word) => {
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word);
}

function buildSummaryDocument(discussion, comments) {
  const participants = [...new Set(comments.map((comment) => comment.user?.username).filter(Boolean))];
  const firstCommentDate = comments[0]?.createdAt;
  const lastCommentDate = comments[comments.length - 1]?.createdAt;
  const themes = extractThemes(discussion, comments);

  const highlights = comments
    .slice(0, 3)
    .map((comment) => `${comment.user?.username || "משתמש"} emphasized: ${comment.content}`);

  const overview = comments.length === 0
    ? "This discussion currently has no comments, so the summary is based on the discussion title and topic only."
    : `This discussion focused on "${discussion?.title || "Untitled discussion"}" and developed through ${comments.length} comments from ${participants.length || 1} participants. The main thread revolved around ${themes.length > 0 ? themes.join(", ") : "the central topic presented in the discussion"}.`;

  const dynamics = comments.length === 0
    ? "Once comments are added, this document will expand with participation patterns, recurring themes, and notable viewpoints."
    : `The conversation opened on ${firstCommentDate ? new Date(firstCommentDate).toLocaleDateString() : "an earlier date"} and most recently updated on ${lastCommentDate ? new Date(lastCommentDate).toLocaleDateString() : "a recent date"}. It combined practical responses with personal perspective, creating a discussion trail that can be revisited quickly.`;

  return {
    title: discussion?.title || "Discussion Summary",
    topic: discussion?.topic || "No topic available",
    category: discussion?.category?.title || "General",
    participants,
    commentsCount: comments.length,
    overview,
    dynamics,
    themes,
    highlights
  };
}

function buildSummaryHtml(summary) {
  const participantMarkup = summary.participants.length > 0
    ? summary.participants.map((participant) => `<li>${participant}</li>`).join("")
    : "<li>No participants yet</li>";

  const themesMarkup = summary.themes.length > 0
    ? summary.themes.map((theme) => `<li>${theme}</li>`).join("")
    : "<li>No recurring themes detected yet</li>";

  const highlightsMarkup = summary.highlights.length > 0
    ? summary.highlights.map((item) => `<li>${item}</li>`).join("")
    : "<li>No highlights yet</li>";

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${summary.title} - Summary</title>
      <style>
        body {
          margin: 0;
          padding: 40px;
          font-family: Georgia, "Times New Roman", serif;
          background: #f7f1e6;
          color: #1c2b36;
        }
        .doc {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px;
          border-radius: 28px;
          border: 1px solid #ddd2c2;
          background: #fffaf0;
        }
        .eyebrow {
          display: inline-block;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(22, 50, 79, 0.08);
          color: #16324f;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1 {
          margin: 14px 0 10px;
          font-size: 42px;
        }
        p {
          line-height: 1.7;
          color: #4d5b68;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 24px 0;
        }
        .meta div, .section {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid #ddd2c2;
          background: rgba(255,255,255,0.72);
        }
        .section {
          margin-top: 14px;
        }
        h2 {
          margin-top: 0;
          color: #16324f;
        }
        ul {
          margin: 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="doc">
        <span class="eyebrow">AI Summary</span>
        <h1>${summary.title}</h1>
        <p>${summary.topic}</p>

        <div class="meta">
          <div><strong>Category</strong><p>${summary.category}</p></div>
          <div><strong>Comments</strong><p>${summary.commentsCount}</p></div>
          <div><strong>Participants</strong><p>${summary.participants.length}</p></div>
        </div>

        <section class="section">
          <h2>Overview</h2>
          <p>${summary.overview}</p>
        </section>

        <section class="section">
          <h2>Conversation Dynamics</h2>
          <p>${summary.dynamics}</p>
        </section>

        <section class="section">
          <h2>Key Themes</h2>
          <ul>${themesMarkup}</ul>
        </section>

        <section class="section">
          <h2>Participants</h2>
          <ul>${participantMarkup}</ul>
        </section>

        <section class="section">
          <h2>Highlights</h2>
          <ul>${highlightsMarkup}</ul>
        </section>
      </div>
    </body>
  </html>`;
}

function buildAiSummaryHtml(aiSummary) {
  const bodyMarkup = aiSummary.summary
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

  return `<!DOCTYPE html>
  <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>${aiSummary.title} - AI Summary</title>
      <style>
        body {
          margin: 0;
          padding: 40px;
          font-family: Georgia, "Times New Roman", serif;
          background: #f7f1e6;
          color: #1c2b36;
        }
        .doc {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px;
          border-radius: 28px;
          border: 1px solid #ddd2c2;
          background: #fffaf0;
        }
        .eyebrow {
          display: inline-block;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(22, 50, 79, 0.08);
          color: #16324f;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1 {
          margin: 14px 0 10px;
          font-size: 42px;
        }
        p {
          line-height: 1.85;
          color: #4d5b68;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 24px 0;
        }
        .meta div, .section {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid #ddd2c2;
          background: rgba(255,255,255,0.72);
        }
        .section {
          margin-top: 14px;
        }
        h2 {
          margin-top: 0;
          color: #16324f;
        }
      </style>
    </head>
    <body>
      <div class="doc">
        <span class="eyebrow">AI Summary</span>
        <h1>${aiSummary.title}</h1>
        <p>${aiSummary.topic}</p>

        <div class="meta">
          <div><strong>קטגוריה</strong><p>${aiSummary.category}</p></div>
          <div><strong>תגובות</strong><p>${aiSummary.commentsCount}</p></div>
          <div><strong>משתתפים</strong><p>${aiSummary.participantsCount}</p></div>
          <div><strong>שורות</strong><p>${aiSummary.lines}</p></div>
        </div>

        <section class="section">
          <h2>תקציר AI</h2>
          ${bodyMarkup}
        </section>
      </div>
    </body>
  </html>`;
}

export default function TopicComments() {
  const navigate = useNavigate();
  const { discussionId } = useParams();
  const dispatch = useDispatch();

  const { items, loading, error } = useSelector(
    (state) => state.comments
  );
  const [newComment, setNewComment] = useState("");
  const [discussion, setDiscussion] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [summaryLines, setSummaryLines] = useState(8);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState("");

const { user } = useSelector((state) => state.auth || {});
  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const res = await fetch(`http://localhost:7500/Forumix/discussions/${discussionId}`);
        const data = await res.json();
        setDiscussion(data);
      } catch (fetchError) {
        console.error(fetchError);
      }
    };

    fetchDiscussion();

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

  const summary = buildSummaryDocument(discussion, items || []);

  const handleDownloadSummary = () => {
    const html = buildSummaryHtml(summary);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${summary.title.replace(/[^\w\u0590-\u05FF-]+/g, "-")}-summary.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintSummary = () => {
    const printWindow = window.open("", "_blank", "width=980,height=760");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(buildSummaryHtml(summary));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleGenerateAiSummary = async () => {
    setAiSummaryLoading(true);
    setAiSummaryError("");

    try {
      const response = await fetch(`http://localhost:7500/Forumix/discussions/${discussionId}/ai-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ lines: summaryLines })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "שגיאה ביצירת תקציר AI");
      }

      setAiSummary(data);
      setShowAiSummary(true);
    } catch (fetchError) {
      console.error(fetchError);
      setAiSummaryError(fetchError.message || "שגיאה ביצירת תקציר AI");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleDownloadAiSummary = () => {
    if (!aiSummary) return;

    const html = buildAiSummaryHtml(aiSummary);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${aiSummary.title.replace(/[^\w\u0590-\u05FF-]+/g, "-")}-ai-summary.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintAiSummary = () => {
    if (!aiSummary) return;

    const printWindow = window.open("", "_blank", "width=980,height=760");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(buildAiSummaryHtml(aiSummary));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="content-panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Discussion Flow</span>
          <h2>{discussion?.title || "תגובות"}</h2>
          {discussion?.topic && <p className="section-intro">{discussion.topic}</p>}
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowSummary((current) => !current)}
        >
          סיכום דיון
        </button>
      </div>

      <section className="summary-panel ai-summary-config-panel">
        <div className="summary-toolbar">
          <div>
            <span className="eyebrow">AI Summary</span>
            <h3>תקציר AI</h3>
            <p className="section-intro">בחר כמה שורות תרצה בתקציר, בין 5 ל־20, וניצור עבורך מסמך תקציר מבוסס AI.</p>
          </div>

          <div className="summary-actions summary-actions-wide">
            <label className="summary-lines-field">
              <span>מספר שורות</span>
              <input
                type="number"
                min="5"
                max="20"
                value={summaryLines}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setSummaryLines(Number.isNaN(nextValue) ? 5 : Math.min(20, Math.max(5, nextValue)));
                }}
              />
            </label>
            <button
              type="button"
              className="primary-button"
              onClick={handleGenerateAiSummary}
              disabled={aiSummaryLoading}
            >
              {aiSummaryLoading ? "יוצר תקציר..." : "תקציר AI"}
            </button>
          </div>
        </div>

        {aiSummaryError && <p className="status-text">{aiSummaryError}</p>}
      </section>

      {showSummary && (
        <section className="summary-panel">
          <div className="summary-toolbar">
            <div>
              <span className="eyebrow">AI Summary</span>
              <h3>{summary.title}</h3>
            </div>

            <div className="summary-actions">
              <button type="button" className="ghost-button" onClick={handleDownloadSummary}>
                הורדת מסמך
              </button>
              <button type="button" className="ghost-button" onClick={handlePrintSummary}>
                הדפסה
              </button>
            </div>
          </div>

          <article className="summary-document">
            <div className="summary-meta-grid">
              <div className="summary-meta-card">
                <strong>קטגוריה</strong>
                <p>{summary.category}</p>
              </div>
              <div className="summary-meta-card">
                <strong>תגובות</strong>
                <p>{summary.commentsCount}</p>
              </div>
              <div className="summary-meta-card">
                <strong>משתתפים</strong>
                <p>{summary.participants.length}</p>
              </div>
            </div>

            <section className="summary-section-card">
              <h4>תקציר כללי</h4>
              <p>{summary.overview}</p>
            </section>

            <section className="summary-section-card">
              <h4>מהלך הדיון</h4>
              <p>{summary.dynamics}</p>
            </section>

            <section className="summary-section-card">
              <h4>נושאים מרכזיים</h4>
              <ul className="summary-list">
                {(summary.themes.length > 0 ? summary.themes : ["טרם זוהו נושאים חוזרים"]).map((theme) => (
                  <li key={theme}>{theme}</li>
                ))}
              </ul>
            </section>

            <section className="summary-section-card">
              <h4>דגשים מתוך התגובות</h4>
              <ul className="summary-list">
                {(summary.highlights.length > 0 ? summary.highlights : ["אין עדיין תגובות להבליט"]).map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          </article>
        </section>
      )}

      {showAiSummary && aiSummary && (
        <section className="summary-panel">
          <div className="summary-toolbar">
            <div>
              <span className="eyebrow">AI Summary</span>
              <h3>{aiSummary.title}</h3>
            </div>

            <div className="summary-actions">
              <button type="button" className="ghost-button" onClick={handleDownloadAiSummary}>
                הורדת מסמך
              </button>
              <button type="button" className="ghost-button" onClick={handlePrintAiSummary}>
                הדפסה
              </button>
            </div>
          </div>

          <article className="summary-document">
            <div className="summary-meta-grid">
              <div className="summary-meta-card">
                <strong>קטגוריה</strong>
                <p>{aiSummary.category}</p>
              </div>
              <div className="summary-meta-card">
                <strong>תגובות</strong>
                <p>{aiSummary.commentsCount}</p>
              </div>
              <div className="summary-meta-card">
                <strong>משתתפים</strong>
                <p>{aiSummary.participantsCount}</p>
              </div>
              <div className="summary-meta-card">
                <strong>שורות</strong>
                <p>{aiSummary.lines}</p>
              </div>
            </div>

            <section className="summary-section-card">
              <h4>תקציר AI</h4>
              <div className="summary-prose">
                {aiSummary.summary.split(/\n+/).filter(Boolean).map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          </article>
        </section>
      )}

      

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
