import {
  ExerciseCandidates,
  GeneratedWorkoutPlan,
  GenerateWorkoutRequest,
} from "./types";

export const WORKOUT_SYSTEM_INSTRUCTION = `
You are Forge AI, an elite strength and conditioning specialist.
Your mission is to design a high-quality, scientifically periodized workout routine based on the user's target muscles, goal, and duration.
CRITICAL PROGRAMMING RULES:
1. Exercise Ordering: Always program heavy multi-joint compound exercises FIRST, followed by accessory and isolation movements.
2. Volume Calibration: For a 45-60 minute workout, program between 4 to 6 exercises total, with 3 to 4 sets per exercise.
3. Reps & Rest:
   - For Hypertrophy / Muscle Building: 8-12 reps, 60-90s rest.
   - For Strength: 4-6 reps, 120-180s rest.
   - For Endurance: 12-15 reps, 45-60s rest.
4. STRICT DATABASE ALLOWLIST: You MUST choose exercises EXCLUSIVELY from the provided CANDIDATE EXERCISES list.
   You must use the exact 'id' and exact 'name' provided in that list.
   You are STRICTLY FORBIDDEN from creating or inventing exercises outside of the candidate list.
`;

//promt sent to google gemini.
export const WORKOUT_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Catchy, motivating name for the workout session",
    },
    description: {
      type: "string",
      description: "2 sentences explaining the workout focus and strategy",
    },
    estimatedDurationMinutes: {
      type: "integer",
      description: "Estimated total duration including rest times",
    },
    targetMuscles: {
      type: "array",
      items: { type: "string" },
      description: "List of primary muscle groups trained",
    },
    exercises: {
      type: "array",
      description: "The sequence of exercises in optimal training order",
      items: {
        type: "object",
        properties: {
          exerciseId: {
            type: "string",
            description: "The EXACT database UUID from the candidate list",
          },
          exerciseName: {
            type: "string",
            description: "The exact name from the candidate list",
          },
          muscle: {
            type: "string",
            description: "The primary muscle trained",
          },
          sets: {
            type: "integer",
            description: "Number of working sets (e.g. 3 or 4)",
          },
          reps: {
            type: "integer",
            description: "Target reps per set (e.g. 8, 10, 12)",
          },
          restSeconds: {
            type: "integer",
            description: "Rest time between sets in seconds (e.g. 60 or 90)",
          },
          coachingTip: {
            type: "string",
            description: "A short technical form cue or tempo instruction",
          },
        },
        required: [
          "exerciseId",
          "exerciseName",
          "muscle",
          "sets",
          "reps",
          "restSeconds",
          "coachingTip",
        ],
      },
    },
  },
  required: [
    "name",
    "description",
    "estimatedDurationMinutes",
    "targetMuscles",
    "exercises",
  ],
};

export const buildWorkout = async (params: {
  targetMuscles: string[];
  candidates: ExerciseCandidates[];
  request: GenerateWorkoutRequest;
  userGoal?: string;
  userExperience?: string;
}) => {
  const { targetMuscles, candidates, request, userGoal, userExperience } =
    params;

  //user's goal:
  const goal = request.fitnessGoal || userGoal || "Build Muscle / Hypertrophy";

  //get user's experience
  const experience =
    request.experienceLevel || userExperience || "Intermediate";

  //workpout duration
  const duration = request.targetDurationMinutes || 50;

  //format exercise list
  const candidateListFormatted = candidates
    .map(
      (c, index) =>
        `${index + 1}. [ID: ${c.id}] ${c.name} (Muscle: ${c.muscle}, Equipment: ${c.equipment || "Standard"}, Difficulty: ${c.difficulty})`
    )
    .join("\n");

  //What the user will see based on their generation of the workout - insight or custom.
  const modeInstruction =
    request.mode === "insight_driven"
      ? "NOTE: This workout was generated to address neglected muscle groups and break performance plateaus identified by Forge AI Coach."
      : "NOTE: This is a custom session focused on the athlete's requested muscle groups.";

  //what is sent to gemini
  return `
ATHLETE PREFERENCES:
- Target Muscle Groups: ${targetMuscles.join(", ")}
- Primary Goal: ${goal}
- Experience Level: ${experience}
- Target Duration: ${duration} minutes
${modeInstruction}
CANDIDATE EXERCISES ALLOWLIST (CHOOSE EXCLUSIVELY FROM THIS LIST):
${candidateListFormatted}
INSTRUCTIONS:
1. Select the 4 to 6 best exercises from the CANDIDATE list to create a balanced, effective ${duration}-minute session.
2. Order them properly (compounds first, isolations later).
3. Assign appropriate sets, reps, and rest times for the ${goal} goal.
4. Output ONLY valid JSON adhering to the required schema.
`;
};

export const validateGeneratedWorkout = (
  workout: GeneratedWorkoutPlan,
  candidates: ExerciseCandidates[]
): GeneratedWorkoutPlan => {
  const validCandidateMap = new Map<string, ExerciseCandidates>();
  for (const c of candidates) {
    validCandidateMap.set(c.id, c);
  }

  //filter out exercises that were invented by gemini.
  const validatedExercises = workout.exercises.filter((ex) => {
    return validCandidateMap.has(ex.exerciseId);
  });

  return {
    ...workout, //workout created by gemini.
    exercises: validatedExercises, //validated exercises
  };
};
