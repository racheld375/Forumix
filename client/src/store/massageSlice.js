// store/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/* ===============================
   📥 שליפת שיחות של המשתמש
================================ */
export const fetchUserChats = createAsyncThunk(
  "chat/fetchUserChats",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:7500/Forumix/chat`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        return rejectWithValue({ status: res.status });
      }

      return await res.json();

    } catch (err) {
      return rejectWithValue({ status: 500, message: err.message });
    }
  }
);

/* ===============================
   📥 שליפת הודעות של צ'אט מסוים
================================ */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (chatId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:7500/Forumix/chat/${chatId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        return rejectWithValue({ status: res.status });
      }

      return await res.json();

    } catch (err) {
      return rejectWithValue({ status: 500, message: err.message });
    }
  }
);

/* ===============================
   🧠 Slice
================================ */
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    messages: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.messages = [];
      state.error = null;
    },
    addMessageRealtime: (state, action) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== fetchUserChats ===== */
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== fetchMessages ===== */
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearMessages,
  addMessageRealtime,
} = chatSlice.actions;

export default chatSlice.reducer;