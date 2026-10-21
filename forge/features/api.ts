import { authClient } from "@/lib/auth-client";
import type {
  PersonalRecord,
  PersonalRecordHero,
  PersonalRecordsResponse,
} from "@/shared/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface UserProfile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  gender: string;
  goal: string;
  experience: string;
  weightUnit: string;
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
  image: string;
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
  ],

  endpoints: (build) => ({
    createWorkout: build.mutation<Workout[], CreateWorkoutRequest>({
      query: (form) => ({
        url: "/api/workouts/create",
        method: "POST",
        body: form,
      }),
      invalidatesTags: ["Workouts"],
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
        searchTerm: Workout[];
      }) => {
        return response.searchTerm;
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
  }),
});

export const {
  useGetScheduledWorkoutsQuery,
  useGetCompletedSessionsQuery,
  useGetWorkoutSessionHistoryQuery,
  useGetAllWorkoutsQuery,
  useGetWorkoutsBySearchQuery,
  useGetExercisesQuery,
  useCreateWorkoutMutation,
  useCreateWorkoutSessionMutation,
  useGetUserStatsQuery,
  useGetPersonalRecordsQuery,
} = api;
