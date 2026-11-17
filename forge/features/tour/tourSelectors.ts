import { TOUR_STAGES, TourStage, TourState } from "./tourState";

// The first stage that is neither completed nor skipped. Returns null when the
// journey is over. Everything the UI needs to know about "where am I" comes from
// this one function, so there is no second copy of the sequence anywhere.
export const selectCurrentStage = (state: TourState): TourStage | null =>
  TOUR_STAGES.find(
    (stage) =>
      !state.completedStages.includes(stage) &&
      !state.skippedStages.includes(stage)
  ) ?? null;

export const selectIsStageComplete = (
  state: TourState,
  stage: TourStage
): boolean => state.completedStages.includes(stage);

export const selectIsStageSkipped = (
  state: TourState,
  stage: TourStage
): boolean => state.skippedStages.includes(stage);

export const selectHistoryForInsight = (
  state: TourState,
  sessionCount: number
): boolean => sessionCount >= 2;

// A stage can only be current while the tour is running. Before it starts,
// TOUR_STAGES[0] would otherwise look "current".
export const selectActiveStage = (state: TourState): TourStage | null =>
  state.startedAt ? selectCurrentStage(state) : null;

export const selectIsTourComplete = (state: TourState): boolean =>
  state.startedAt !== null && selectCurrentStage(state) === null;

// The final message is a one-shot: show it once every stage is resolved, until
// the user acknowledges it.
export const selectShouldShowCompletion = (state: TourState): boolean =>
  selectIsTourComplete(state) && !state.completionAcknowledged;
