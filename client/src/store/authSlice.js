import { createSlice } from "@reduxjs/toolkit";

function normalizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    username: user.username || null,
    profession: user.profession || null,
    advancedInfo: user.advancedInfo || null,
    iat: user.iat,
    exp: user.exp
  };
}

const initialState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token") || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = normalizeUser(action.payload.user);

      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
