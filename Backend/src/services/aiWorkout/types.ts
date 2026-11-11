export type WorkoutGenerationMode = "custom" | "insight_driven";

//the type to accommodate what will be sent to our Google Gemini.
export interface GenerateWorkoutRequest {
  mode: WorkoutGenerationMode;
  // Used for "custom" mode (e.g. ["chest", "shoulders"]):
  targetMuscles?: string[];

  insightFocus?: "neglected_muscles" | "plateau_breaker" | "balanced_routine";

  scheduledDate?: string;
  targetDurationMinutes?: number;
  fitnessGoal?: string;
  experienceLevel?: string;
  preferredEquipment?: string[];
}

//Accommodate the exercise required for this workout generation - handed to gemini.
export interface ExerciseCandidates {
  id: string;
  name: string;
  muscle: string;
  equipment: string | null;
  difficulty: string;
}

//coming from gemini
export interface GeneratedWorkoutExercise {
  exerciseId: string; // Must match an existing UUID from Forge's exercises table
  exerciseName: string;
  muscle: string;
  sets: number;
  reps: number;
  restSeconds: number;
  coachingTip: string;
}

//workout generation from gemini
export interface GeneratedWorkoutPlan {
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  targetMuscles: string[];
  scheduledDate?: string;
  exercises: GeneratedWorkoutExercise[];
}

export interface AiWorkoutDraftResponse {
  draftId: string; // The UUID in ai_generated_workouts
  status: "draft" | "saved" | "discarded";
  workout: GeneratedWorkoutPlan;
  createdAt: string;
}

export type GenerateWorkoutResult =
  | {
      success: true;
      data: AiWorkoutDraftResponse;
      source: "gemini";
    }
  | {
      success: false;
      error: string;
      retryAfterSeconds?: number;
    };
