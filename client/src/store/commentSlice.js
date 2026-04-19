// store/commentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchCommentsByDiscussion = createAsyncThunk(
  "comments/fetchByDiscussion",
  async (discussionId, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:7500/Forumix/comment/by-discussion/${discussionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) return rejectWithValue({ status: 401 });
      if (res.status === 403) return rejectWithValue({ status: 403 });

      const data = await res.json();
      return data.comments;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const commentSlice = createSlice({
  name: "comments",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearComments: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsByDiscussion.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCommentsByDiscussion.fulfilled, (state, action) => {
  state.loading = false;
  state.items = action.payload || [];
})

      .addCase(fetchCommentsByDiscussion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearComments } = commentSlice.actions;
export default commentSlice.reducer;

