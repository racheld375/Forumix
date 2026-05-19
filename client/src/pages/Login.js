import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/authSlice";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:7500/Forumix/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      const decoded = jwtDecode(data.token);

      // 🔥 שמירה ל-localStorage (חשוב מאוד)
      localStorage.setItem("token", data.token);

      dispatch(
        loginSuccess({
          token: data.token,
          user: decoded,
        })
      );

      navigate("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Welcome back</span>
        {/* <h3>התחבר לחשבון</h3> */}
        {/* <p>Pick up discussions, messages, and your professional profile right where you left them.</p> */}

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
        />
        <button type="submit" className="primary-button">Login</button>

        <p className="auth-switch">
          אין לך חשבון?{" "}
          <button type="button" className="text-button" onClick={() => navigate("/register")}>
            הרשמה
          </button>
        </p>
      </form>
    </section>
  );
}
