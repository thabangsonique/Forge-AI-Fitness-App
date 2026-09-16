import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

interface initialStateTypes {
  createWorkoutModal: boolean;
  aiCoachModal: boolean;
}

const initialState: initialStateTypes = {
  createWorkoutModal: false,
  aiCoachModal: false,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setCreateWorkout: (state, action: PayloadAction<boolean>) => {
      state.createWorkoutModal = action.payload;
    },

    setAiCoach: (state, action: PayloadAction<boolean>) => {
      state.aiCoachModal = action.payload;
    },
  },
});

export const { setCreateWorkout, setAiCoach } = globalSlice.actions;
export default globalSlice.reducer;
