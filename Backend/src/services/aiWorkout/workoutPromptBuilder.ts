import {
  expandMuscleAliases,
  missingCandidatePriorities,
  muscleMatchesPriority,
  requiredMuscleComponents,
} from "./muscleGroups";
import {
  ExerciseCandidates,
  GeneratedWorkoutPlan,
  GenerateWorkoutRequest,
} from "./types";

export const WORKOUT_SYSTEM_INSTRUCTION = `
You are Forge AI, a structured and practical workout planner. Use the athlete's goal, experience, schedule, duration, equipment, preferences, limitations, training history, and coaching insights. Never invent missing user information. Treat insight priorities as requirements: select suitable approved exercises that directly address them, avoid redundant concentration on one group, and keep the description truthful to the final exercise list. Consider secondary muscles, but count coverage only from verified primary muscle metadata. Respect restrictions and recovery; use conservative workload. Order compounds before isolation where appropriate. Choose exercises exclusively from the supplied candidate allowlist with exact IDs and names. Return only schema-compliant JSON.
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
  insight?: unknown;
  fitnessContext?: unknown;
}) => {
  const {
    targetMuscles,
    candidates,
    request,
    userGoal,
    userExperience,
    insight,
    fitnessContext,
  } = params;

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

  //ADD
  const priorityCoverageRules = targetMuscles
    .map((priority) => {
      const components = requiredMuscleComponents(priority);

      const componentRules = components
        .map((component) => {
          const matchingMuscles = [
            ...new Set(
              candidates
                .filter((candidate) =>
                  muscleMatchesPriority(candidate.muscle, component)
                )
                .map((candidate) => candidate.muscle)
            ),
          ];

          return `- ${component}: Include at least ONE exercise with a primary muscle matching: ${matchingMuscles.join(", ")}`;
        })
        .join("\n");

      return `Priority "${priority}" requires coverage of EVERY component below:\n${componentRules}`;
    })
    .join("\n");

  //What the user will see based on their generation of the workout - insight or custom.
  const modeInstruction =
    request.mode === "insight_driven"
      ? `
INSIGHT-DRIVEN REQUIREMENTS (MANDATORY):

Use the athlete's coaching insights and fitness context to build an appropriate workout.

MANDATORY PRIMARY-MUSCLE COVERAGE:
Every priority listed below must be directly covered by at least one approved exercise.

${priorityCoverageRules}

IMPORTANT RULES:
1. Every component of a grouped priority is mandatory. Do not treat grouped priorities as alternatives.
2. For example, "legs (hamstrings, glutes)" requires at least one hamstring exercise AND at least one glute exercise.
3. Select exercises exclusively from the supplied candidate allowlist.
4. Coverage is determined by the verified primary muscle of each exercise, not its secondary muscles.
5. Do not omit a required muscle simply to reduce the number of exercises.
6. Use appropriate sets and rest periods to manage the session duration.
7. Keep the workout description consistent with the exercises actually selected.

Saved coaching insight:
${JSON.stringify(insight ?? null)}

Underlying fitness context:
${JSON.stringify(fitnessContext ?? null)}
`
      : "NOTE: This is a custom session focused on the athlete's requested muscle groups.";

  //what is sent to gemini
  return `
ATHLETE PREFERENCES:
- Target Muscle Groups: ${targetMuscles.join(", ")}
- Primary Goal: ${goal}
- Experience Level: ${experience}
- Training days per week: ${(params.fitnessContext as any)?.profile?.workoutsPerWeekTarget ?? "not available"}
- Target Duration: ${duration} minutes
- Available equipment: ${request.preferredEquipment?.join(", ") || "not specified"}
- Exercise preferences: ${request.exercisePreferences?.join(", ") || "none specified"}
- Excluded exercise IDs: ${request.excludedExerciseIds?.join(", ") || "none"}
- Excluded exercises: ${request.excludedExercises?.join(", ") || "none"}
- Disclosed limitations: ${request.userDisclosedLimitations?.join(", ") || "none supplied"}
${modeInstruction}
CANDIDATE EXERCISES ALLOWLIST (CHOOSE EXCLUSIVELY FROM THIS LIST):
${candidateListFormatted}
INSTRUCTIONS:
1. Select a realistic number of non-redundant exercises from the CANDIDATE list; prioritize direct coverage of insight requirements.
2. Order them properly (compounds first, isolations later).
3. Assign appropriate sets, reps, and rest times for the ${goal} goal.
4. Return exactly this JSON shape with every field present and correctly typed; use an empty string only for an unavailable optional coaching tip, never omit required fields:
{"name":"string","description":"string","estimatedDurationMinutes":45,"targetMuscles":["string"],"exercises":[{"exerciseId":"approved candidate ID","exerciseName":"exact candidate name","muscle":"candidate primary muscle","sets":3,"reps":10,"restSeconds":60,"coachingTip":"string"}]}
5. Output only the JSON object. Do not return {}, markdown, commentary, or a different wrapper object.
`;
};

const canonicalMuscle = (muscle: string) =>
  muscle.trim().toLowerCase().replace(/[_-]/g, " ");

export const selectSessionPriorities = (
  insightMuscles: string[],
  trainingGaps: Array<{ muscle: string; severity: string }>,
  durationMinutes: number
): string[] => {
  const maxGroups = durationMinutes >= 40 ? 5 : durationMinutes >= 30 ? 4 : 3;
  const ranked = [
    ...trainingGaps
      .filter((gap) => gap.severity === "high")
      .map((gap) => gap.muscle),
    ...insightMuscles,
    ...trainingGaps
      .filter((gap) => gap.severity === "moderate")
      .map((gap) => gap.muscle),
  ];
  return [
    ...new Set(
      ranked.map((muscle) => muscle.trim().toLowerCase()).filter(Boolean)
    ),
  ].slice(0, maxGroups);
};

export const validateWorkoutAgainstRequirements = (
  workout: GeneratedWorkoutPlan,
  candidates: ExerciseCandidates[],
  priorities: string[],
  durationMinutes: number
): { workout?: GeneratedWorkoutPlan; errors: string[] } => {
  const errors: string[] = [];
  if (!workout || typeof workout.name !== "string" || !workout.name.trim())
    errors.push("missing workout name");
  if (
    !workout ||
    typeof workout.description !== "string" ||
    !workout.description.trim()
  )
    errors.push("missing workout description");
  if (
    !workout ||
    !Number.isInteger(workout.estimatedDurationMinutes) ||
    workout.estimatedDurationMinutes < 1 ||
    workout.estimatedDurationMinutes > Math.max(180, durationMinutes * 2)
  )
    errors.push("estimated duration is invalid");
  if (!workout || !Array.isArray(workout.targetMuscles))
    errors.push("target muscle list is invalid");
  if (
    !workout ||
    !Array.isArray(workout.exercises) ||
    workout.exercises.length === 0
  )
    errors.push("exercise list is empty");
  const byId = new Map(
    candidates.map((candidate) => [candidate.id, candidate])
  );
  const approvedExercises = (
    Array.isArray(workout?.exercises) ? workout.exercises : []
  ).map((exercise, index) => {
    if (!exercise || typeof exercise !== "object") {
      errors.push(`exercise ${index + 1} is malformed`);
      return exercise;
    }
    const candidate = byId.get(exercise.exerciseId);
    if (!candidate) {
      errors.push(`exercise ${index + 1} is not an approved candidate`);
      return exercise;
    }
    if (exercise.exerciseName !== candidate.name)
      errors.push(`exercise ${index + 1} name does not match its approved ID`);
    if (
      !Number.isInteger(exercise.sets) ||
      exercise.sets < 1 ||
      exercise.sets > 6
    )
      errors.push(`exercise ${index + 1} sets must be 1-6`);
    if (
      !Number.isInteger(exercise.reps) ||
      exercise.reps < 1 ||
      exercise.reps > 30
    )
      errors.push(`exercise ${index + 1} reps must be 1-30`);
    if (
      !Number.isInteger(exercise.restSeconds) ||
      exercise.restSeconds < 0 ||
      exercise.restSeconds > 360
    )
      errors.push(`exercise ${index + 1} rest must be 0-360 seconds`);
    if (typeof exercise.coachingTip !== "string")
      errors.push(`exercise ${index + 1} coaching tip must be text`);
    return {
      ...exercise,
      exerciseName: candidate.name,
      muscle: candidate.muscle,
    };
  });
  const coveredExercises = approvedExercises.filter(
    (exercise) => exercise && byId.has(exercise.exerciseId)
  );
  const applicablePriorities = priorities.filter(
    (priority) =>
      !missingCandidatePriorities(
        [priority],
        candidates.map((candidate) => candidate.muscle)
      ).length
  );
  const missingCandidates = missingCandidatePriorities(
    priorities,
    candidates.map((candidate) => candidate.muscle)
  );
  if (missingCandidates.length)
    errors.push(
      `no approved exercise candidates for: ${missingCandidates.join(", ")}`
    );
  const missing = applicablePriorities.flatMap((priority) => {
    const missingComponents = requiredMuscleComponents(priority).filter(
      (component) =>
        !coveredExercises.some((exercise) =>
          muscleMatchesPriority(
            byId.get(exercise.exerciseId)!.muscle,
            component
          )
        )
    );
    return missingComponents.length
      ? [
          `${priority}${priority.includes("(") ? ` (missing: ${missingComponents.join(", ")})` : ""}`,
        ]
      : [];
  });
  if (missing.length)
    errors.push(
      `insight priorities not directly covered: ${missing.join(", ")}`
    );
  if (
    requestSafeDescription(
      workout?.description,
      approvedExercises.filter(Boolean),
      priorities
    )
  )
    errors.push(
      "description claims muscle groups absent from the exercise list"
    );
  return {
    workout: errors.length
      ? undefined
      : { ...workout, exercises: approvedExercises },
    errors,
  };
};

const requestSafeDescription = (
  description: string,
  exercises: GeneratedWorkoutPlan["exercises"],
  priorities: string[]
) => {
  if (!description) return false;
  const represented = expandMuscleAliases(
    exercises.map((exercise) => canonicalMuscle(exercise.muscle))
  );
  return priorities.some((priority) => {
    const label = canonicalMuscle(priority);
    return (
      description.toLowerCase().includes(label) && !represented.includes(label)
    );
  });
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
