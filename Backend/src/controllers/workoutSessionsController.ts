//user fetches workout session by ID. - DONE
//2. (GET) user to fetch dates of the workout sessions the user had-use for calendar. - DONE
//3. (GET) user fetch workout session history. -DONE
//4.(POST) post request to save the workoutsession that the user had. -DONE
//5. (streak-GET) user fetch dates for previous workout session. -DONE
import { fromNodeHeaders } from "better-auth/node";
import { and, eq, inArray } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";

import { workoutSession, workoutSessionSets } from "../db/schema";
import { auth } from "../lib/auth";

//FETCH WORKOUT SESSION BY ID.
export const getWorkoutSessionById = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorised-no token found." });
    }

    const { id } = req.params;

    //fetch the workout session.
    const workoutSessionData = await db.query.workoutSession.findFirst({
      where: and(
        eq(workoutSession.id, id as string),
        eq(workoutSession.userId, session.user.id)
      ),
    });

    if (!workoutSessionData) {
      return res.status(404).json({ error: "Workout session not found." });
    }

    //fetch the sets of the session once found.
    const sets = await db.query.workoutSessionSets.findMany({
      where: eq(workoutSessionSets.sessionId, workoutSessionData.id),
    });

    return res.status(200).json({ success: true, ...workoutSessionData, sets });
  } catch (error: any) {
    console.error("Server error", error);
    return res
      .status(500)
      .json({ message: "server workout session error", error: error.message });
  }
};

//GET DATES OF WORKOUT SESSIONS CREATED- for calendar display.
export const getSessionDates = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized-no token found" });
    }

    //grab dates only from the session table.
    const sessionDates = await db.query.workoutSession.findMany({
      where: eq(workoutSession.userId, session.user.id),
      columns: { completedAt: true },
    });

    if (!sessionDates) {
      return res.status(404).json({ error: "No sessions recorded yet" });
    }

    //convert dates tonew set of strings.
    const uniqueDates = new Set(
      sessionDates.map((ws) => {
        const date = new Date(ws.completedAt);

        return date.toISOString().split("T")[0];
      })
    );

    //order set of dates from old to new.
    const orderedDates = Array.from(uniqueDates).sort();

    return res.status(200).json({ success: true, orderedDates });
  } catch (error: any) {
    console.error("Server dates error", error);
    return res.status(500).json({
      message: "server workout session Dates error",
      error: error.message,
    });
  }
};

//GET ALL WORKOUT SESSIONS HISTORY- for all workout sessions.
export const getWorkoutSessionHistory = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userSessions = await db.query.workoutSession.findMany({
      where: eq(workoutSession.userId, session.user.id),
      orderBy: (workoutSession, { desc }) => [desc(workoutSession.completedAt)],
    });

    if (userSessions.length === 0) {
      return res.status(404).json({ success: true, workoutSession: [] });
    }

    //grab only the session ids.
    const sessionIds = userSessions.map((ws) => ws.id);

    //fetch all sets for all sessions.
    const allSets = await db.query.workoutSessionSets.findMany({
      where: inArray(workoutSessionSets.sessionId, sessionIds),
      orderBy: (workoutSessionSets, { asc }) => [
        asc(workoutSessionSets.setNumber),
      ],
    });

    //place holder for grouping sessions to their sets.
    const setsBySessionId = new Map<
      string,
      (typeof workoutSessionSets.$inferSelect)[]
    >();

    for (const set of allSets) {
      const existing = setsBySessionId.get(set.sessionId) || [];
      existing.push(set);
      setsBySessionId.set(set.sessionId, existing);
    }

    const workoutsessionsWithSets = userSessions.map((ws) => ({
      ...ws,
      sets: setsBySessionId.get(ws.id),
    }));

    return res
      .status(200)
      .json({ success: true, workoutSessions: workoutsessionsWithSets });
  } catch (error: any) {
    console.error("Error fetching workout session history", error);
    return res.status(500).json({ error: error.message });
  }
};

//CREATE A WORKOUT SESSION.
export const creatWorkoutSession = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const { workoutId, startedtAt, completedAt, durationSeconds, sets } =
      req.body;

    if (!workoutId || !startedtAt || !completedAt) {
      return res.status(400).json({
        error: "workoutId, startedAt, and completedAt are required.",
      });
    }

    //calculate the duration in seconds.
    const start = new Date(startedtAt); //format friendly for postgres,
    const end = new Date(completedAt);
    const calculatedDuration = Math.floor(
      (end.getTime() - start.getTime()) / 1000
    );

    const finalDuration = durationSeconds ?? calculatedDuration;

    //store session inside the workout session table,
    const [newSession] = await db
      .insert(workoutSession)
      .values({
        userId: session.user.id,
        workoutId,
        startedtAt: start,
        durationSeconds: finalDuration,
        completedAt: end,
      })
      .returning();

    //store sets of this session. in the workout session sets table
    if (sets && sets.length > 0 && Array.isArray(sets)) {
      const sessionSets = sets.map((set: any) => ({
        sessionId: newSession.id,
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight,
      }));

      //store in the workout session sets table.
      await db.insert(workoutSessionSets).values(sessionSets);
    }

    return res.status(200).json({ success: true, workoutSession: newSession });
  } catch (error: any) {
    console.error("Error creating workout session", error);
    return res.status(500).json({ error: error.message });
  }
};

//GET THE WORKOUT STREAK.
export const getWorkoutStreak = async (req: Request, res: Response) => {
  try {
    //check user authentication.
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    //get workout session dates.
    const workoutDates = await db.query.workoutSession.findMany({
      where: eq(workoutSession.userId, session.user.id),
      columns: {
        completedAt: true,
      },
    });

    //new set of dates in JS object format.
    const uniqueDates = new Set(
      workoutDates.map((ws) => {
        const date = new Date(ws.completedAt);
        return date.toISOString().split("T")[0];
      })
    );

    const sortedDates = Array.from(uniqueDates).sort();

    const streak = calculateStreak(sortedDates);
  } catch (error: any) {}
};

const calculateStreak = (sortedDates: string[]) => {
  if (sortedDates.length === 0) {
    return 0;
  }

  //grab today, yesterday, and most recent session date.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = new Date(sortedDates[sortedDates.length - 1]);
  mostRecent.setHours(0, 0, 0, 0);

  //check if user had session today and/ yesterday for streak.
  if (
    mostRecent.getTime() !== today.getTime() &&
    mostRecent.getTime() !== yesterday.getTime()
  ) {
    return 0; // streak is broken
  }

  let streak = 1;
  let currentDate = mostRecent;

  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const expectedPrevious = new Date(currentDate);
    expectedPrevious.setDate(expectedPrevious.getDate() - 1);

    const actualPrevious = new Date(sortedDates[i]);
    actualPrevious.setHours(0, 0, 0, 0);

    if (actualPrevious.getTime() === expectedPrevious.getTime()) {
      streak++;
      currentDate = actualPrevious;
    } else {
      break; //break loop streak is broken.
    }
  }

  return streak;
};
