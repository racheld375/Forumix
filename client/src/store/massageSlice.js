// store/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/* ===============================
   📥 שליפת שיחות של המשתמש
================================ */
export const fetchUserChats = createAsyncThunk(
  "chat/fetchUserChats",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:7500/Forumix/chat`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) return rejectWithValue({ status: 401 });
      if (res.status === 403) return rejectWithValue({ status: 403 });

      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* ===============================
   📥 שליפת הודעות של צ'אט מסוים
================================ */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (chatId, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:7500/Forumix/chat/${chatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) return rejectWithValue({ status: 401 });
      if (res.status === 403) return rejectWithValue({ status: 403 });

      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
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
    error: null
  },
  reducers: {
    clearMessages: (state) => {
      state.messages = [];
    },
    addMessageRealtime: (state, action) => {
      state.messages.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder

      /* ===== fetchUserChats ===== */
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
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
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearMessages,
  addMessageRealtime
} = chatSlice.actions;

export default chatSlice.reducer;