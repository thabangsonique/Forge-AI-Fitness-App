import globalReducer from "@/features/globalSlice";
import { configureStore } from "@reduxjs/toolkit";
import { api } from "../features/api";

export const store = configureStore({
  reducer: {
    global: globalReducer,
    [api.reducerPath]: api.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>; //for use Selector
export type AppDispatch = typeof store.dispatch;
