import { authClient } from "@/lib/auth-client";
import type {
  PersonalRecord,
  PersonalRecordHero,
  PersonalRecordsResponse,
} from "@/shared/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type Gender = "male" | "female";
export type FitnessGoal = "build muscle" | "lose fat" | "gain strength";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type WeightUnit = "kg" | "lb";

export interface UserProfile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  gender: Gender;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  workoutsPerWeek: number;
  weightUnit: WeightUnit;
}

export interface UpdateProfileRequest {
  gender?: Gender;
  goal?: FitnessGoal;
  experience?: ExperienceLevel;
  workoutsPerWeek?: number;
  weightUnit?: WeightUnit;
}

export interface ScheduledWorkouts {
  workoutId: string;
  scheduledDate: string;
}

export interface CompletedSessions {
  workoutId: string;
  completedAt: string;
}

export interface SessionHistory {
  id: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  startedtAt: Date;
  completedAt: Date;
  durationSeconds: number;
  createdAt: Date;
  sets: sessionSet[];
}

export interface sessionSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  workoutExerciseId: string;
  name: string;
  description: string | null;
  muscle: string | null;
  equipment: string | null;
  difficulty: string | null;
  forceType: string | null;
  mechanics: string | null;
  category: string | null;
  exerciseCategory?: string | null;
  image: string | null;
  instruction: string[];
  tips: string[];
  commonMistakes: string[];
  position: number;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface SelectedExercise {
  exerciseId: string;
  name: string;
  muscle: string | null;
  reps: number;
  sets: number;
  restSeconds: number;
}

export interface CreateWorkoutRequest {
  name: string;
  description: string;
  category: string;
  scheduledDate?: String;
  exercises: SelectedExercise[];
}

export interface workoutForm {
  name: string;
  description: string;
  category: string;
  exercises: SelectedExercise[];
}

export interface Workout {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  workoutCategory: string;
  workoutType: string;
  exercises: Exercise[];

  exerciseCount: number;
  totalSets: number;
}

export interface WorkoutSession {
  workoutId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  exerciseId: string;
  setNumber: number;
  weight: string;
  reps: string;
}

export interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

export interface WorkoutSets {
  [exerciseId: string]: {
    [setIndex: number]: SetData;
  };
}

export interface UserStats {
  overview: {
    totalWorkout: number;
    completedSession: CompletedSession;
    userProfile: UserProfile;
  };

  exerciseBreakedown: ExerciseBreakedown;
  recentActivity: RecentActivity;
  peformanceMatrics: PerformanceMetrics;
  totalWeeklyVolume: TotalWeeklyVolume;
  weeklyMuscleSets: WeeklyMuscleSets[];
  muscleStrength: MuscleStrength[];
}

export interface ExerciseBreakedown {
  weekStart: Date;
  weekEndExclusive: Date;
  totalSets: number;
  muscleDistribution: MuscleDistribution[];
}

export interface MuscleDistribution {
  muscle: string;
  sets: number;
  percentage: number;
}

export interface WeeklyMuscleSets {
  weekStart: string;
  muscle: string;
  sets: number;
}

export interface CompletedSession {
  totalSessions: number;
  totalDurationSeconds: number;
}

export interface RecentActivity {
  totalVolume: number | undefined;
  totalTimeMinutes: number;
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: Date;
  durationSeconds: number;
}

export interface PerformanceMetrics {
  muscle: string;
  maxWeight: number;
  avgWeight: number;
  maxReps: number;
  totalVolume: number;
  totalSets: number;
}

export interface TotalWeeklyVolume {
  weekStart: Date;
  weekEndExclusive: Date;
  totalWeeklyVolume: number;
  dailyVolumes: DailyVolumes[];
}

export interface DailyVolumes {
  date: string;
  volume: number;
}

export interface MuscleStrength {
  weekStart: string;
  weekLabel: string;
  muscle: string;
  best1RM: number;
}

export interface AIMuscleFocusInsight {
  title: string;
  explanation: string;
  neglectedMuscles: string[];
  recommendations: string[];
}

export interface AiVolumeInsight {
  title: string;
  explanation: string;
  trendStatus: "increasing" | "decreasing" | "consistent" | "insufficient_data";
  recommendations: string[];
}

export interface AiStrengthInsight {
  title: string;
  praise: string;
  progressionAnalysis: string;
  exercisesToFocus: string[];
}

export interface AiOverallSummary {
  headline: string;
  detailedFeedback: string;
  nextMilestone: string;
  goalAlignment: string;
}

export interface AiCoachInsightResponse {
  muscleFocus: AIMuscleFocusInsight;
  volume: AiVolumeInsight;
  strength: AiStrengthInsight;
  overall: AiOverallSummary;
  generatedAt: string;
  fromCache?: boolean; // true if the backend returned a cached result
}

//tell user their trial standing.
export interface AiTrialSummary {
  isEligible: boolean;
  isExpired: boolean;
  daysRemaining: number;
  insightsUsed: number;
  insightsRemaining: number;
  workoutGenerations: number;
  workoutGenerationsRemaining: number;
}

export interface AiStatusResponse {
  tier: "free" | "premium";
  allowed: boolean;
  reason?: string;
  trialSummary?: AiTrialSummary;
}

//types for workout generation.

//single exercise type
export interface AiGeneratedExercise {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  sets: number;
  reps: number;
  restSeconds: number;
  coachingTip: string;
}

//full generated workout type
export interface AiGeneratedWorkoutPlan {
  workoutName: string;
  workoutCategory: string;
  durationEstimateMinutes: number;
  targetMuscles: string[];
  exercises: AiGeneratedExercise[];
  coachNote: string;
}

//Type the workout draft.
export interface AiWorkoutDraftResponse {
  success: boolean;
  draftId: string;
  workout: AiGeneratedWorkoutPlan;
  generatedAt: string;
}

//Type for requests to be sent to Gemini.
export interface GenerateWorkoutRequest {
  mode: "custom" | "insight_driven";
  targetMuscles?: string[]; // Required only when mode is "custom"
  scheduledDate?: string; // ISO date string e.g. "2025-02-14"
  preferredEquipment?: string[]; // Optional filter
  durationMinutes?: number; // Optional target duration
}

//Type for the saved draft to workout response.
export interface SaveWorkoutDraftResponse {
  success: boolean;
  workoutId: string;
  workoutName: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001",

    prepareHeaders: async (headers) => {
      const userSession = await authClient.getSession();
      const token = userSession.data?.session.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: [
    "ScheduledWorkouts",
    "CompletedSessions",
    "SessionHistory",
    "Workouts",
    "Exercises",
    "Progress",
    "Records",
    "AiCoach",
  ],

  endpoints: (build) => ({
    createWorkout: build.mutation<Workout[], CreateWorkoutRequest>({
      query: (form) => ({
        url: "/api/workouts/create",
        method: "POST",
        body: form,
      }),
      invalidatesTags: ["Workouts", "ScheduledWorkouts"],
    }),

    updateWorkout: build.mutation<
      { success: boolean; workout: Workout },
      { id: string } & CreateWorkoutRequest
    >({
      query: ({ id, ...form }) => ({
        url: `/api/workouts/${id}`,
        method: "PUT",
        body: form,
      }),
      invalidatesTags: ["Workouts", "ScheduledWorkouts"],
    }),

    deleteWorkout: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/api/workouts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workouts", "ScheduledWorkouts"],
    }),

    getScheduledWorkouts: build.query<ScheduledWorkouts[], void>({
      query: () => "/api/scheduled-workouts",

      transformResponse: (response: {
        success: true;
        scheduledWorkouts: ScheduledWorkouts[];
      }) => {
        return response.scheduledWorkouts;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ workoutId }) => ({
                type: "ScheduledWorkouts" as const,
                id: workoutId,
              })),
              { type: "ScheduledWorkouts", id: "LIST" },
            ]
          : [{ type: "ScheduledWorkouts", id: "LISt" }],
    }),

    //scheduled workouts within an explicit date range (used by the calendar).
    getScheduledWorkoutsInRange: build.query<
      ScheduledWorkouts[],
      { from: string; to: string }
    >({
      query: ({ from, to }) => ({
        url: "/api/scheduled-workouts",
        params: { from, to },
      }),

      transformResponse: (response: {
        success: true;
        scheduledWorkouts: ScheduledWorkouts[];
      }) => {
        return response.scheduledWorkouts;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ workoutId }) => ({
                type: "ScheduledWorkouts" as const,
                id: workoutId,
              })),
              { type: "ScheduledWorkouts", id: "RANGE" },
            ]
          : [{ type: "ScheduledWorkouts", id: "RANGE" }],
    }),

    //COMPLETED SESSIONS.
    getCompletedSessions: build.query<CompletedSessions[], void>({
      query: () => "/api/workouts/session-history",

      transformResponse: (response: {
        success: true;
        workoutSessions: Array<{
          workoutId: string;
          completedAt: string;
          [key: string]: any;
        }>;
      }) => {
        return response.workoutSessions.map((session) => ({
          workoutId: session.workoutId,
          completedAt: session.completedAt,
        }));
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ workoutId }) => ({
                type: "CompletedSessions" as const,
                id: workoutId,
              })),
              { type: "CompletedSessions", id: "LIST" },
            ]
          : [{ type: "CompletedSessions", id: "LIST" }],
    }),

    //create session.
    createWorkoutSession: build.mutation<WorkoutSession, WorkoutSession>({
      query: (workoutSets) => ({
        url: `/api/workouts/session`,
        method: "POST",
        body: workoutSets,
      }),
      invalidatesTags: [
        {
          type: "CompletedSessions",
          id: "LIST",
        },
        { type: "SessionHistory", id: "LIST" },
        "Progress",
        // Logging a workout changes the insight fingerprint, so the cached
        // insight query must refetch and report no_cache until regenerated.
        "AiCoach",
      ],
    }),

    //fetch user workout session history.
    getWorkoutSessionHistory: build.query<SessionHistory[], void>({
      query: () => "/api/workouts/session-history",

      transformResponse: (response: {
        success: true;
        workoutSessions: SessionHistory[];
      }) => {
        return response.workoutSessions;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ workoutId }) => ({
                type: "SessionHistory" as const,
                id: workoutId,
              })),
              { type: "SessionHistory", id: "LIST" },
            ]
          : [{ type: "SessionHistory", id: "LIST" }],
    }),

    //fetch all user workouts.
    getAllWorkouts: build.query<Workout[], void>({
      query: () => "/api/workouts/",

      transformResponse: (response: {
        success: true;
        allWorkouts: Workout[];
      }) => {
        return response.allWorkouts;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Workouts" as const,
                id,
              })),
              { type: "Workouts" as const, id: "LIST" },
            ]
          : [{ type: "Workouts" as const, id: "LIST" }],
    }),

    //get workouts by search
    getWorkoutsBySearch: build.query<Workout[], string>({
      query: (searchTerm) => ({
        url: `/api/workouts/search`,
        method: "GET",
        params: { name: searchTerm },
      }),

      transformResponse: (response: {
        success: true;
        searchResults: Workout[];
      }) => {
        return response.searchResults;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Workouts" as const, id })),
              { type: "Workouts" as const, id: "LIST" },
            ]
          : [{ type: "Workouts" as const, id: "LIST" }],
    }),

    //fetch all exercises.
    getExercises: build.query<Exercise[], void>({
      query: () => "/api/exercises",
      transformResponse: (response: {
        success: true;
        allExercises: Exercise[];
      }) => {
        return response.allExercises;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Exercises" as const,
                id,
              })),
              { type: "Exercises" as const, id: "LIST" },
            ]
          : [{ type: "Exercises" as const, id: "LIST" }],
    }),

    //GET USER STATS.
    getUserStats: build.query<UserStats, void>({
      query: () => "/api/performance/stats",

      transformResponse: (response: { success: true; stats: UserStats }) => {
        return response?.stats;
      },

      providesTags: ["Progress"],
    }),

    //get user PR stats
    getPersonalRecords: build.query<PersonalRecordsResponse, void>({
      query: () => `/api/records`,

      transformResponse: (response: {
        success: true;
        hero: PersonalRecordHero;
        records: PersonalRecord[];
      }) => {
        return {
          hero: response.hero,
          records: response.records,
          success: response.success,
        };
      },

      providesTags: ["Records"],
    }),

    //AI API ENDPOINTS
    getCoachInsights: build.query<AiCoachInsightResponse | null, void>({
      query: () => "/api/ai/coach/insights",

      transformResponse: (response: {
        success: true;
        source: "cache" | "no_cache";
        data: AiCoachInsightResponse | null;
        generatedAt?: string;
      }) => response.data ?? null,

      providesTags: ["AiCoach"],
    }),

    generateCoachInsight: build.mutation<AiCoachInsightResponse, void>({
      query: () => ({
        url: "/api/ai/coach/insights",
        method: "POST",
      }),

      transformResponse: (response: {
        success: true;
        source: "cache" | "gemini";
        data: AiCoachInsightResponse;
      }) => response.data,

      invalidatesTags: ["AiCoach"],
    }),
  }),
});

export const {
  useGetScheduledWorkoutsQuery,
  useGetScheduledWorkoutsInRangeQuery,
  useGetCompletedSessionsQuery,
  useGetWorkoutSessionHistoryQuery,
  useGetAllWorkoutsQuery,
  useGetWorkoutsBySearchQuery,
  useGetExercisesQuery,
  useCreateWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
  useCreateWorkoutSessionMutation,
  useGetUserStatsQuery,
  useGetPersonalRecordsQuery,
  useGenerateCoachInsightMutation,
  useGetCoachInsightsQuery,
} = api;
