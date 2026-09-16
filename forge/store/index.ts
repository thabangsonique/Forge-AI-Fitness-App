import globalReducer from "@/features/globalSlice";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    global: globalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>; //for use Selector
export type AppDispatch = typeof store.dispatch;
