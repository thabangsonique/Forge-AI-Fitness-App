/**
 * Additional catalogue exercises required by Forge's system workout templates.
 * IDs are stable seed IDs. Confirm they do not already exist before inserting.
 * Field names mirror the exercise objects supplied for the current schema.
 */
export const systemExerciseAdditions = [
  { id: "a1000000-0000-4000-8000-000000000001", userId: null, slug: "Incline_Dumbbell_Press", name: "Incline Dumbbell Press", description: "Incline Dumbbell Press", muscle: "chest", equipment: "dumbbell", difficulty: "beginner", forceType: "push", mechanics: "compound", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000002", userId: null, slug: "Reverse_Fly", name: "Reverse Fly", description: "Reverse Fly", muscle: "rear deltoids", equipment: "dumbbell", difficulty: "beginner", forceType: "pull", mechanics: "isolation", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000003", userId: null, slug: "Face_Pull", name: "Face Pull", description: "Face Pull", muscle: "rear deltoids", equipment: "cable", difficulty: "beginner", forceType: "pull", mechanics: "isolation", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000004", userId: null, slug: "Overhead_Triceps_Extension", name: "Overhead Triceps Extension", description: "Overhead Triceps Extension", muscle: "triceps", equipment: "cable", difficulty: "beginner", forceType: "push", mechanics: "isolation", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000005", userId: null, slug: "Seated_Leg_Curl", name: "Seated Leg Curl", description: "Seated Leg Curl", muscle: "hamstrings", equipment: "machine", difficulty: "beginner", forceType: "pull", mechanics: "isolation", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000006", userId: null, slug: "Hip_Thrust", name: "Hip Thrust", description: "Hip Thrust", muscle: "glutes", equipment: "barbell", difficulty: "beginner", forceType: "push", mechanics: "compound", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000007", userId: null, slug: "Hanging_Knee_Raise", name: "Hanging Knee Raise", description: "Hanging Knee Raise", muscle: "abdominals", equipment: "pull-up bar", difficulty: "intermediate", forceType: "pull", mechanics: "compound", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000008", userId: null, slug: "Cable_Crunch", name: "Cable Crunch", description: "Cable Crunch", muscle: "abdominals", equipment: "cable", difficulty: "beginner", forceType: "pull", mechanics: "isolation", category: "strength" },
  { id: "a1000000-0000-4000-8000-000000000009", userId: null, slug: "Dumbbell_Shrugs", name: "Dumbbell Shrugs", description: "Dumbbell Shrugs", muscle: "trapezius", equipment: "dumbbell", difficulty: "beginner", forceType: "pull", mechanics: "isolation", category: "strength" },
] as const;
