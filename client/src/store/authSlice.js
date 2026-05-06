import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

const savedToken = localStorage.getItem("token") || null;

function getUserFromToken(token) {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch {
    localStorage.removeItem("token");
    return null;
  }
}

const initialState = {
  user: getUserFromToken(savedToken),
  token: savedToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;

      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
