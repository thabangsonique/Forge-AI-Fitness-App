// The ordered sequence of teaching moments. This array is the single source of
// truth for "what comes next" - the current stage is derived from it, never
// stored. Reordering or inserting a stage here is the only change needed to
// change the journey.
export const TOUR_STAGES = [
  "HOME_INTRO",
  "LIVE_WORKOUT",
  "WORKOUT_SAVED",
  "PROGRESS_INTRO",
  "AI_INSIGHT_INTRO",
] as const;

export type TourStage = (typeof TOUR_STAGES)[number];

export interface TourState {
  version: 1;
  // Scopes the tour to one account so signing out and back in as someone else
  // does not inherit their progress.
  userId: string | null;
  // Non-null once the tour has actually begun for this user.
  startedAt: string | null;
  // Stages the user explicitly finished.
  completedStages: TourStage[];
  // Stages the user explicitly dismissed.
  skippedStages: TourStage[];
  // Set when the final "Forge-ready" message has been acknowledged.
  completedAt: string | null;
  completionAcknowledged: boolean;
}

export const initialTourState: TourState = {
  version: 1,
  userId: null,
  startedAt: null,
  completedStages: [],
  skippedStages: [],
  completedAt: null,
  completionAcknowledged: false,
};

// Bump the suffix if the stored shape ever changes incompatibly.
export const TOUR_STORAGE_KEY = "forge_tour_state_v1";