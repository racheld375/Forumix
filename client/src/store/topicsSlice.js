// store/topicsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// async action
export const fetchTopics = createAsyncThunk(
  "topics/fetchTopics",
  async () => {
    const response = await fetch("http://localhost:7500/Forumix/category");
    
    return await response.json();
  }
);

const topicsSlice = createSlice({
  name: "topics",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default topicsSlice.reducer;
