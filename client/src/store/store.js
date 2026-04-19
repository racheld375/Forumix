import { configureStore } from "@reduxjs/toolkit";
import discussionsReducer from "./discussionsSlice";
import commentsReducer from "./commentSlice";
import topicsReducer from "./topicsSlice";
import authReducer from "./authSlice";
import chatReducer from "./massageSlice";
export const store = configureStore({
  reducer: {
    discussions: discussionsReducer,
    comments: commentsReducer,
    topics: topicsReducer ,
    auth: authReducer,
    chat: chatReducer
  }
});

