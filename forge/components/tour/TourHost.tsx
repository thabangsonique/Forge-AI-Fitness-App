import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import TourCallout from "@/components/tour/TourCallout";
import { useGetCompletedSessionsQuery } from "@/features/api";
import {
  completeTourStage,
  hydrateTour,
  resetTour,
  startTour,
} from "@/features/tour/tourSlice";
import { loadTourState, saveTourState } from "@/features/tour/tourStorage";
import { useTour } from "@/features/tour/useTour";
import { useSession } from "@/lib/auth-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Mounted once near the root. Owns every side effect of the tour (loading,
// starting, persisting) so the screens only ever read `stage` and call
// `complete`/`skip`.
export default function TourHost({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const tour = useTour();
  const state = useAppSelector((root) => root.tour);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [hydrated, setHydrated] = useState(false);

  // RTK Query is still loading, so `undefined` means "unknown yet" and `[]`
  // means "confirmed no sessions". Only the confirmed case may fast-forward.
  const { data: completedSessions } = useGetCompletedSessionsQuery(
    undefined,
    { skip: !userId }
  );

  // Fast-forward at most once per account, otherwise completing a first
  // workout later would rewind the tour.
  const fastForwardedFor = useRef<string | null>(null);

  // 1. Load whatever we saved last time.
  useEffect(() => {
    let cancelled = false;

    loadTourState().then((saved) => {
      if (cancelled) return;
      if (saved) dispatch(hydrateTour(saved));
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // 2. Bind the tour to the signed-in account. A different user id means the
  //    stored progress belongs to someone else, so start clean.
  useEffect(() => {
    if (!hydrated || !userId) return;
    if (state.userId === userId) return;

    console.log(`[Tour] Starting tour for new user: ${userId}`);
    dispatch(resetTour());
    dispatch(startTour({ userId, now: new Date().toISOString() }));
  }, [dispatch, hydrated, state.userId, userId]);

  // 3. Existing accounts already have training history. Teaching them
  //    "First workout complete!" would be wrong, so mark those stages done.
  //    NOTE: We only skip if they have more than 1 session, as a brand new
  //    user might have 1 starter session created during onboarding.
  useEffect(() => {
    if (!hydrated || !userId) return;
    if (state.startedAt === null) return;
    if (fastForwardedFor.current === userId) return;
    if (completedSessions === undefined) return;

    fastForwardedFor.current = userId;

    console.log(
      `[Tour] Checking history for ${userId}: ${completedSessions.length} sessions`
    );

    if (completedSessions.length > 1) {
      console.log("[Tour] User has history. Fast-forwarding to Progress.");
      dispatch(completeTourStage("HOME_INTRO"));
      dispatch(completeTourStage("LIVE_WORKOUT"));
      dispatch(completeTourStage("WORKOUT_SAVED"));
    }
  }, [completedSessions, dispatch, hydrated, state.startedAt, userId]);

  // Debug log for development
  useEffect(() => {
    if (hydrated && userId) {
      console.log(`[Tour] Active Stage: ${tour.stage || "NONE/COMPLETED"}`);
    }
  }, [hydrated, userId, tour.stage]);

  // 4. Persist every change. Skipped until hydration finishes so we never
  //    overwrite storage with the empty initial state.
  useEffect(() => {
    if (!hydrated) return;
    void saveTourState(state);
  }, [hydrated, state]);

  return (
    <>
      {children}

      {tour.shouldShowCompletion ? (
        <TourCallout
          title="You're officially Forge-ready."
          description="You've completed your first workout, explored your progress and received your first coaching insight. Keep showing up, and let Forge help you train smarter."
          primaryLabel="Let's Go!"
          onPrimary={tour.acknowledgeCompletion}
        />
      ) : null}
    </>
  );
}