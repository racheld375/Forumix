import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./common/Layout";
import Login from "./pages/Login";
import TopicDiscussions from "./pages/TopicDiscussions";
import TopicComments from "./pages/TopicComments";
import UserProfile from "./pages/UserProfile";
import ProtectedRoute from "./common/ProtectedRoute";
import ChatWindow from "./pages/ChatWindow";
import MyAccount from "./pages/MyAccount";
import AdminPage from "./pages/AdminPage";
import Register from "./pages/Register";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { loginSuccess } from "./store/authSlice";

function App() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (token && !currentUser) {
      try {
        console.log("App init raw token:", token);
        const decoded = jwtDecode(token);
        console.log("App init decoded token:", decoded);

        const resolvedUser = {
          ...decoded,
          ...storedUser,
          username: decoded.username || storedUser?.username || null
        };

        console.log("App init resolved user:", resolvedUser);

        if (!resolvedUser.username) {
          console.warn("Stored token is stale and missing username. Clearing localStorage token.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }

        dispatch(
          loginSuccess({
            token,
            user: resolvedUser,
          })
        );
      } catch (err) {
        console.error("Failed to decode stored token:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [dispatch, currentUser]);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<h1>home page</h1>} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route path="topic/:topicId" element={<TopicDiscussions />} />
            <Route path="discussion/:discussionId" element={<TopicComments />} />
            <Route path="user/:userId" element={<UserProfile />} />

            <Route path="my-account" element={<MyAccount />} />
            <Route path="chat/:chatId" element={<ChatWindow />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
