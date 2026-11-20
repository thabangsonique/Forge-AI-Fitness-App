import { strict as assert } from "node:assert";
import { test } from "node:test";
import { selectSessionPriorities, validateWorkoutAgainstRequirements } from "../workoutPromptBuilder";
import type { ExerciseCandidates, GeneratedWorkoutPlan } from "../types";

const candidates: ExerciseCandidates[] = [
  { id: "back-id", name: "Dumbbell Row", muscle: "back", equipment: "dumbbell", difficulty: "beginner" },
  { id: "ham-id", name: "Dumbbell Romanian Deadlift", muscle: "hamstrings", equipment: "dumbbell", difficulty: "beginner" },
  { id: "glute-id", name: "Dumbbell Glute Bridge", muscle: "glutes", equipment: "dumbbell", difficulty: "beginner" },
  { id: "bi-id", name: "Dumbbell Curl", muscle: "biceps", equipment: "dumbbell", difficulty: "beginner" },
  { id: "tri-id", name: "Dumbbell Triceps Extension", muscle: "triceps", equipment: "dumbbell", difficulty: "beginner" },
  { id: "chest-a", name: "Dumbbell Press", muscle: "chest", equipment: "dumbbell", difficulty: "beginner" },
  { id: "chest-b", name: "Dumbbell Fly", muscle: "chest", equipment: "dumbbell", difficulty: "beginner" },
  { id: "chest-c", name: "Push-up", muscle: "chest", equipment: "bodyweight", difficulty: "beginner" },
];
const exercise = (id: string, name: string, muscle: string) => ({ exerciseId: id, exerciseName: name, muscle, sets: 3, reps: 10, restSeconds: 60, coachingTip: "Use controlled reps." });
const plan = (exercises: GeneratedWorkoutPlan["exercises"], description = "A balanced strength session."): GeneratedWorkoutPlan => ({ name: "Balanced Session", description, estimatedDurationMinutes: 45, targetMuscles: ["back", "hamstrings", "glutes", "biceps", "triceps"], exercises });
const priorities = ["back", "hamstrings", "glutes", "biceps", "triceps"];

test("rejects chest-only exercise selection when insights prioritize neglected groups", () => {
  const result = validateWorkoutAgainstRequirements(plan([
    exercise("chest-a", "Dumbbell Press", "chest"),
    exercise("chest-b", "Dumbbell Fly", "chest"),
    exercise("chest-c", "Push-up", "chest"),
  ]), candidates, priorities, 45);
  assert.equal(result.workout, undefined);
  assert.ok(result.errors.some((error) => error.includes("not directly covered")));
});

test("accepts a balanced workout whose verified primary muscles cover the insight priorities", () => {
  const result = validateWorkoutAgainstRequirements(plan([
    exercise("back-id", "Dumbbell Row", "back"),
    exercise("ham-id", "Dumbbell Romanian Deadlift", "hamstrings"),
    exercise("glute-id", "Dumbbell Glute Bridge", "glutes"),
    exercise("bi-id", "Dumbbell Curl", "biceps"),
    exercise("tri-id", "Dumbbell Triceps Extension", "triceps"),
  ], "Back, hamstrings, glutes, biceps, and triceps receive direct work."), candidates, priorities, 45);
  assert.equal(result.errors.length, 0);
  assert.equal(result.workout?.exercises.length, 5);
});

test("rejects empty lists and nonexistent exercise IDs", () => {
  assert.ok(validateWorkoutAgainstRequirements(plan([]), candidates, [], 45).errors.includes("exercise list is empty"));
  const result = validateWorkoutAgainstRequirements(plan([exercise("invented", "Invented Row", "back")]), candidates, [], 45);
  assert.ok(result.errors.some((error) => error.includes("not an approved candidate")));
});

test("limits a short-session priority list while keeping highest-severity gaps first", () => {
  assert.deepEqual(selectSessionPriorities(
    ["chest", "back", "glutes", "biceps", "triceps"],
    [{ muscle: "hamstrings", severity: "high" }, { muscle: "quadriceps", severity: "moderate" }],
    30
  ), ["hamstrings", "chest", "back", "glutes"]);
});

test("recognizes verified database labels such as lats as coverage for a back priority", () => {
  const latsCandidate = { id: "lat-id", name: "Lat Pulldown", muscle: "lats", equipment: "machine", difficulty: "beginner" };
  const result = validateWorkoutAgainstRequirements(
    plan([exercise("lat-id", "Lat Pulldown", "lats")], "A back session with direct lat work."),
    [latsCandidate],
    ["back"],
    25
  );
  assert.equal(result.errors.length, 0);
});

test("treats explicitly listed subgroups inside a broad priority as separate requirements", () => {
  const result = validateWorkoutAgainstRequirements(
    plan([exercise("ham-id", "Dumbbell Romanian Deadlift", "hamstrings")]),
    candidates,
    ["legs (hamstrings, glutes)"],
    45
  );
  assert.ok(result.errors.some((error) => error.includes("glutes")));
});
