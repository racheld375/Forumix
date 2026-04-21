// store/discussionsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchDiscussionsByTopic = createAsyncThunk(
  "discussions/fetchByTopic",
  async (topicId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token"); // ✅ שליפת טוקן

      const res = await fetch(
        `http://localhost:7500/Forumix/discussions/by-category/${topicId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ שליחה לשרת
          },
        }
      );

      // 🔥 טיפול נכון בשגיאות
      if (!res.ok) {
        return rejectWithValue({ status: res.status });
      }

      const data = await res.json();
      return data;

    } catch (err) {
      return rejectWithValue({ status: 500, message: err.message });
    }
  }
);

const discussionsSlice = createSlice({
  name: "discussions",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDiscussions: (state) => {
      state.items = [];
      state.error = null; // ✅ ניקוי שגיאה גם
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscussionsByTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscussionsByTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDiscussionsByTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDiscussions } = discussionsSlice.actions;
export default discussionsSlice.reducer;
