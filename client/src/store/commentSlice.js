// store/commentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
export const createComment = createAsyncThunk(
  "comments/createComment",
  async (commentData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:7500/Forumix/comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(commentData),
        }
      );

      if (!res.ok) {
        return rejectWithValue({ status: res.status });
      }

      const data = await res.json();
      return data.comment;
    } catch (err) {
      return rejectWithValue({ status: 500, message: err.message });
    }
  }
);
export const fetchCommentsByDiscussion = createAsyncThunk(
  "comments/fetchByDiscussion",
  async (discussionId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token"); // ✅ שליפת טוקן

      const res = await fetch(
        `http://localhost:7500/Forumix/comment/by-discussion/${discussionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ שליחה לשרת
          },
        }
      );

      // 🔥 טיפול אחיד בשגיאות
      if (!res.ok) {
        return rejectWithValue({ status: res.status });
      }

      const data = await res.json();
      return data.comments || [];

    } catch (err) {
      return rejectWithValue({ status: 500, message: err.message });
    }
  }
);

const commentSlice = createSlice({
  name: "comments",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearComments: (state) => {
      state.items = [];
      state.error = null; // ✅ ניקוי שגיאות
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsByDiscussion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentsByDiscussion.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCommentsByDiscussion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createComment.fulfilled, (state, action) => {
  state.items.unshift(action.payload);
})
  },
});

export const { clearComments } = commentSlice.actions;
export default commentSlice.reducer;