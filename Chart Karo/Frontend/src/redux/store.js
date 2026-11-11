import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { chatApi } from "./api/chatApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, chatApi.middleware),
});
