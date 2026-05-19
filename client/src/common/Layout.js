import socket from "../socket";

import { useNavigate } from 'react-router-dom';
import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTopics } from "../store/topicsSlice";
import { logout } from "../store/authSlice";
export default function Layout() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(state => state.topics);
  const token = useSelector(state => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchTopics());
  }, [dispatch]);

  useEffect(() => {

    if (token) {
      socket.auth = { token };
      socket.connect();
    }

    return () => socket.disconnect();

  }, [token]);

  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-top">
          <div className="brand-block">
            <NavLink to="/" className="brand-mark">
              "יחד בדרך"
            </NavLink>
            <p className="brand-subtitle">
              קהילת אמהות תומכת, לומדת וצומחת.
            </p>
          </div>

          <div className="header-actions">
            <NavLink to="/" className="header-link">
              בית
            </NavLink>
            <NavLink to="/account" className="header-link">
              אזור אישי
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className="header-link">
                דשבורד ניהולי
              </NavLink>
            )}

            {user ? (
              <div className="user-chip">
                <span>{user.username ? `שלום ${user.username}` : "Logged in"}</span>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <button type="button" className="primary-button" onClick={() => navigate("/login")}>
                Login
              </button>
            )}
          </div>
        </div>

        <div className="topic-ribbon">
          {loading && <p className="status-text">Loading topics...</p>}
          {error && <p className="status-text">Error loading topics</p>}

          {!loading && !error && items.map(topic => (
            <NavLink
              key={topic._id || topic.id}
              to={`/topic/${topic._id}`}
              className={({ isActive }) => `topic-pill${isActive ? " active" : ""}`}
            >
              {topic.title}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="page-shell">
        
        <Outlet />
      </main>
    </div>
  );
}
