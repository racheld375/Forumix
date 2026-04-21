
//
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
  const displayName = user?.username || "Guest";

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
    <>
      <header>

        <nav style={{ display: "flex", gap: "20px" }}>
          {loading && <p>טוען...</p>}
          {error && <p>שגיאה: {error}</p>}

          {items.map(topic => (
            <NavLink key={topic.id} to={`/topic/${topic._id}`}>
              {topic.title}
            </NavLink>
          ))}
        </nav>
        <nav>

        <NavLink to="/">בית</NavLink>

        {/* {user && ( */}
          <NavLink to="/my-account">
            האזור האישי
          </NavLink>
        {/* )} */}

      </nav>
<h2>Forumix</h2>

      <div>
        {token ? (
          <>
            <span>Hello {displayName}</span>
            <button onClick={handleLogout}>התנתקות</button>
          </>
        ) : (
          <span>Hello {displayName}</span>
        )}
      </div>

      {!token && (
        <button onClick={() => navigate("/login")}>
          התחברות
        </button>
      )}
      </header>

      <main>
        <Outlet />
      </main>

      

      
    </>
  );
}
