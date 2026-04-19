// store/discussionsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchDiscussionsByTopic = createAsyncThunk(
  "discussions/fetchByTopic",
  async (topicId, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:7500/Forumix/discussions/by-category/${topicId}`,
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

const discussionsSlice = createSlice({
  name: "discussions",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearDiscussions: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscussionsByTopic.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDiscussionsByTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDiscussionsByTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearDiscussions } = discussionsSlice.actions;
export default discussionsSlice.reducer;
