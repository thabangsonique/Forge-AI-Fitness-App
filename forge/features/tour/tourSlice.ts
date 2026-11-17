import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { selectCurrentStage } from "./tourSelectors";
import { TourStage, TourState, initialTourState } from "./tourState";

const freshState = (): TourState => ({
  ...initialTourState,
  completedStages: [],
  skippedStages: [],
});

export const tourSlice = createSlice({
  name: "tour",
  initialState: initialTourState,
  reducers: {
    // Replace the whole state from AsyncStorage. Kept as one action so a
    // malformed payload cannot produce a half-hydrated state.
    hydrate: (_state, action: PayloadAction<TourState>) => action.payload,

    start: (state, action: PayloadAction<{ userId: string; now: string }>) => {
      state.userId = action.payload.userId;
      state.startedAt = action.payload.now;
    },

    // Only the current stage may be completed. An out-of-order or duplicated
    // call is silently ignored instead of corrupting the sequence - this is the
    // guard that makes the state machine safe.
    complete: (state, action: PayloadAction<TourStage>) => {
      const stage = action.payload;

      if (selectCurrentStage(state) !== stage) {
        return;
      }

      if (state.completedStages.includes(stage)) {
        return;
      }

      state.completedStages.push(stage);
    },

    skip: (state, action: PayloadAction<TourStage>) => {
      const stage = action.payload;

      if (selectCurrentStage(state) !== stage) {
        return;
      }

      if (state.skippedStages.includes(stage)) {
        return;
      }

      state.skippedStages.push(stage);
    },

    acknowledgeCompletion: (state, action: PayloadAction<string>) => {
      state.completionAcknowledged = true;
      state.completedAt = action.payload;
    },

    reset: () => freshState(),
  },
});

export const {
  hydrate: hydrateTour,
  start: startTour,
  complete: completeTourStage,
  skip: skipTourStage,
  acknowledgeCompletion: acknowledgeTourCompletion,
  reset: resetTour,
} = tourSlice.actions;

export default tourSlice.reducer;