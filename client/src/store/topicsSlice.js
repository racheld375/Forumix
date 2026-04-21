// store/topicsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchTopics = createAsyncThunk(
  "topics/fetchTopics",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:7500/Forumix/category",
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }), // ✅ חכם – רק אם יש טוקן
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

const topicsSlice = createSlice({
  name: "topics",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default topicsSlice.reducer;
