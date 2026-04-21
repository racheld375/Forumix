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
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      console.log("Login raw token:", data.token);
      const decoded = jwtDecode(data.token);
      console.log("Login decoded token:", decoded);

      const resolvedUser = {
        ...decoded,
        ...data.user,
        username: data.user?.username || decoded.username || null
      };

      console.log("Login resolved user:", resolvedUser);

      dispatch(
        loginSuccess({
          token: data.token,
          user: resolvedUser,
        })
      );

      navigate("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <button type="submit">Login</button>

      <p>
        אין לך חשבון?{" "}
        <span onClick={() => navigate("/register")}>הרשמה</span>
      </p>
    </form>
  );
}
