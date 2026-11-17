import { useCallback } from "react";
import {
  acknowledgeTourCompletion,
  completeTourStage,
  resetTour,
  skipTourStage,
} from "./tourSlice";
import {
  selectActiveStage,
  selectIsTourComplete,
  selectShouldShowCompletion,
} from "./tourSelectors";
import { TourStage } from "./tourState";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// The only API screens should use. Screens never touch the raw state shape and
// never dispatch actions directly, so the "where am I" rule lives in exactly one
// place (tourSelectors.ts).
export const useTour = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((root) => root.tour);

  const stage = selectActiveStage(state);
  const isComplete = selectIsTourComplete(state);
  const shouldShowCompletion = selectShouldShowCompletion(state);

  const complete = useCallback(
    (target: TourStage) => dispatch(completeTourStage(target)),
    [dispatch]
  );

  const skip = useCallback(
    (target: TourStage) => dispatch(skipTourStage(target)),
    [dispatch]
  );

  const acknowledgeCompletion = useCallback(
    () => dispatch(acknowledgeTourCompletion(new Date().toISOString())),
    [dispatch]
  );

  const reset = useCallback(() => dispatch(resetTour()), [dispatch]);

  return {
    stage,
    isComplete,
    shouldShowCompletion,
    complete,
    skip,
    acknowledgeCompletion,
    reset,
  };
};