import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Layout from "./common/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TopicDiscussions from "./pages/TopicDiscussions";
import TopicComments from "./pages/TopicComments";
import UserProfile from "./pages/UserProfile";
import ChatWindow from "./pages/ChatWindow";
import MyAccount from "./pages/MyAccount";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState("");
  const [latestDiscussions, setLatestDiscussions] = useState([]);
  const [latestComments, setLatestComments] = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const activeRequestRef = useRef(0);

  const runSearch = async (rawQuery) => {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setSearchPerformed(false);
      setError("");
      return;
    }

    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:7500/Forumix/discussions/search?q=${encodeURIComponent(trimmedQuery)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Search failed");
      }

      if (activeRequestRef.current !== requestId) {
        return;
      }

      setResults(data);
      setSearchPerformed(true);
    } catch (err) {
      if (activeRequestRef.current !== requestId) {
        return;
      }

      setResults([]);
      setSearchPerformed(true);
      setError("Search is temporarily unavailable.");
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    runSearch(query);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchPerformed(false);
      setError("");
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      runSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    let ignore = false;

    const loadLatestActivity = async () => {
      setLatestLoading(true);

      try {
        const [discussionRes, commentRes] = await Promise.all([
          fetch("http://localhost:7500/Forumix/discussions/last10"),
          fetch("http://localhost:7500/Forumix/comment/last10")
        ]);

        const [discussionData, commentData] = await Promise.all([
          discussionRes.json(),
          commentRes.json()
        ]);

        if (ignore) {
          return;
        }

        setLatestDiscussions(Array.isArray(discussionData) ? discussionData : []);
        setLatestComments(Array.isArray(commentData?.comments) ? commentData.comments : []);
      } catch (err) {
        if (!ignore) {
          setLatestDiscussions([]);
          setLatestComments([]);
        }
      } finally {
        if (!ignore) {
          setLatestLoading(false);
        }
      }
    };

    loadLatestActivity();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">Forumix</span>
        <h1>Conversations with texture, not just comments.</h1>
        <p>
          Explore professional communities, follow active discussions, and move from public threads
          into focused one-on-one chat when a real connection starts.
        </p>
      </div>

      <div className="hero-grid">
        <div className="hero-card">
          <strong>Community-first</strong>
          <p>Topic hubs keep discovery simple and keep discussion organized.</p>
        </div>
        <div className="hero-card">
          <strong>Private follow-up</strong>
          <p>Turn good replies into direct conversations without losing the thread.</p>
        </div>
        <div className="hero-card">
          <strong>Readable flow</strong>
          <p>Discussion, comments, and messaging share one calm visual language.</p>
        </div>
      </div>

      <div className="search-panel">
        <div className="search-heading">
          <span className="eyebrow">Search Everything</span>
          <h2>Find a word across categories, discussions, and comments</h2>
          <p>We’ll show every discussion where the term appears and let you jump straight into it.</p>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a word or phrase..."
          />
          <button type="submit" className="primary-button">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className="status-text">{error}</p>}

        {searchPerformed && !loading && results.length === 0 && !error && (
          <p className="status-text">No discussions found for that search.</p>
        )}

        {results.length > 0 && (
          <div className="search-results-grid">
            {results.map((result) => (
              <article key={result._id} className="search-result-card">
                <div className="search-result-topline">
                  <strong>{result.title}</strong>
                  <span>{result.commentsCount || 0} comments</span>
                </div>

                <p className="search-result-topic">{result.topic}</p>

                <div className="search-result-meta">
                  <span>{result.category?.title || "General"}</span>
                  <span>Matches: {result.matchedIn?.join(", ") || "discussion"}</span>
                </div>

                {result.commentPreview && (
                  <p className="search-result-preview">Comment match: {result.commentPreview}</p>
                )}

                <NavLink className="inline-link" to={`/discussion/${result._id}`}>
                  Open discussion
                </NavLink>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="home-activity-grid">
        <section className="activity-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Latest Discussions</span>
              <h2>Last 10 discussions</h2>
            </div>
          </div>

          {latestLoading ? (
            <p className="status-text">Loading latest discussions...</p>
          ) : latestDiscussions.length === 0 ? (
            <p className="status-text">No recent discussions yet.</p>
          ) : (
            <div className="activity-stack">
              {latestDiscussions.map((discussion) => (
                <article key={discussion._id} className="activity-card">
                  <strong>{discussion.title}</strong>
                  <p>{discussion.topic}</p>
                  <div className="activity-meta">
                    <span>{discussion.category?.title || "General"}</span>
                    <span>{discussion.creator?.username || "Unknown"}</span>
                  </div>
                  <NavLink className="inline-link" to={`/discussion/${discussion._id}`}>
                    Open discussion
                  </NavLink>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="activity-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Latest Comments</span>
              <h2>Last 10 comments</h2>
            </div>
          </div>

          {latestLoading ? (
            <p className="status-text">Loading latest comments...</p>
          ) : latestComments.length === 0 ? (
            <p className="status-text">No recent comments yet.</p>
          ) : (
            <div className="activity-stack">
              {latestComments.map((comment) => (
                <article key={comment._id} className="activity-card">
                  <strong>{comment.user?.username || "Unknown user"}</strong>
                  <p>{comment.content}</p>
                  <div className="activity-meta">
                    <span>{comment.discussion?.topic || "Discussion"}</span>
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <NavLink className="inline-link" to={`/discussion/${comment.discussion?._id || ""}`}>
                    Go to discussion
                  </NavLink>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function App() {
  const currentUser = useSelector((state) => state.auth.user);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="topic/:topicId" element={<TopicDiscussions />} />
            <Route path="discussion/:discussionId" element={<TopicComments />} />
            <Route path="user/:userId" element={<UserProfile user={currentUser} />} />

            <Route path="my-account" element={<MyAccount />} />
            <Route path="account" element={<MyAccount />} />
            <Route path="chat/:chatId" element={<ChatWindow />} />
            <Route path="user/:userId" element={<UserProfile />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
