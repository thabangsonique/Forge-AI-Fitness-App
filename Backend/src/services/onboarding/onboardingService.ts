import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { profiles, scheduledWorkouts, workouts } from "../../db/schema";
import type { CompleteOnboardingInput } from "../../validations/onboardingValidation";

const SPLIT_DAYS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6],
};

const SPLIT_NAMES: Record<number, string> = {
  1: "Full Body",
  2: "Full Body",
  3: "Full Body",
  4: "Upper / Lower",
  5: "Upper / Lower + Push / Pull",
  6: "Push / Pull / Legs",
  7: "Push / Pull / Legs + Active Rest",
};

export const getPreferredDays = (workoutsPerWeek: number) =>
  SPLIT_DAYS[workoutsPerWeek] ?? SPLIT_DAYS[3];

export const getSplitName = (workoutsPerWeek: number) =>
  SPLIT_NAMES[workoutsPerWeek] ?? SPLIT_NAMES[3];

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const getScheduleDates = (workoutsPerWeek: number) => {
  const preferredDays = getPreferredDays(workoutsPerWeek);
  const today = startOfDay(new Date());

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  let dates = preferredDays.map((dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date;
  });

  dates = dates.filter((date) => date >= today);

  if (dates.length === 0) {
    dates = preferredDays.map((dayIndex) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex + 7);
      return date;
    });
  }

  return dates;
};

const scoreWorkout = (
  workout: typeof workouts.$inferSelect,
  input: CompleteOnboardingInput
) => {
  let score = 0;

  if (workout.goal === input.goal) score += 4;
  if (workout.experience === input.experience) score += 3;
  if (
    !workout.trainingLocation ||
    workout.trainingLocation === input.trainingLocation
  ) {
    score += 2;
  }
  if (workout.daysPerWeek != null) {
    score += Math.max(
      0,
      2 - Math.abs(workout.daysPerWeek - input.workoutsPerWeek)
    );
  }
  if (workout.name.toLowerCase().includes("full body")) {
    score += 0.5;
  }

  return score;
};

const pickStarterWorkout = (
  candidates: (typeof workouts.$inferSelect)[],
  input: CompleteOnboardingInput
) => {
  if (candidates.length === 0) {
    return null;
  }

  const exact = candidates.find(
    (workout) =>
      workout.goal === input.goal &&
      workout.experience === input.experience &&
      workout.daysPerWeek === input.workoutsPerWeek &&
      (!input.trainingLocation ||
        !workout.trainingLocation ||
        workout.trainingLocation === input.trainingLocation)
  );

  if (exact) {
    return exact;
  }

  const fullBody = candidates.find((workout) =>
    workout.name.toLowerCase().includes("full body")
  );

  if (fullBody) {
    return fullBody;
  }

  return [...candidates].sort(
    (a, b) => scoreWorkout(b, input) - scoreWorkout(a, input)
  )[0];
};

export const completeOnboarding = async (
  userId: string,
  input: CompleteOnboardingInput
) => {
  const preferredDays = getPreferredDays(input.workoutsPerWeek);
  const onboardingCompletedAt = new Date();

  const profileValues = {
    gender: input.gender,
    goal: input.goal,
    experience: input.experience,
    workoutsPerWeek: input.workoutsPerWeek,
    trainingLocation: input.trainingLocation ?? null,
    weightUnit: input.weightUnit ?? "kg",
    weightKg: input.weightKg ?? null,
    heightCm: input.heightCm ?? null,
    birthYear: input.birthYear ?? null,
    preferredDays,
    painPoints: input.painPoints,
    onboardingCompletedAt,
  };

  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  const profile = existingProfile
    ? (
        await db
          .update(profiles)
          .set(profileValues)
          .where(eq(profiles.userId, userId))
          .returning()
      )[0]
    : (
        await db
          .insert(profiles)
          .values({ ...profileValues, userId })
          .returning()
      )[0];

  const systemWorkouts = await db.query.workouts.findMany({
    where: eq(workouts.workoutType, "system"),
  });

  const starterWorkout = pickStarterWorkout(systemWorkouts, input);
  const scheduleDates = getScheduleDates(input.workoutsPerWeek);

  let scheduledCount = 0;

  if (starterWorkout) {
    const rangeStart = scheduleDates[0];
    const rangeEnd = new Date(scheduleDates[scheduleDates.length - 1]);
    rangeEnd.setHours(23, 59, 59, 999);

    const existingSchedules = await db.query.scheduledWorkouts.findMany({
      where: and(
        eq(scheduledWorkouts.userId, userId),
        gte(scheduledWorkouts.scheduledDate, rangeStart),
        lte(scheduledWorkouts.scheduledDate, rangeEnd)
      ),
    });

    const occupiedDates = new Set(
      existingSchedules.map((schedule) => dateKey(schedule.scheduledDate))
    );

    const rows = scheduleDates
      .filter((date) => !occupiedDates.has(dateKey(date)))
      .map((date) => ({
        userId,
        workoutId: starterWorkout.id,
        scheduledDate: date,
        createdAt: new Date(),
      }));

    if (rows.length > 0) {
      await db.insert(scheduledWorkouts).values(rows);
      scheduledCount = rows.length;
    }
  }

  return {
    profile,
    starterWorkout: starterWorkout
      ? {
          id: starterWorkout.id,
          name: starterWorkout.name,
          splitType: getSplitName(input.workoutsPerWeek),
        }
      : null,
    scheduledCount,
    preferredDays,
  };
};
