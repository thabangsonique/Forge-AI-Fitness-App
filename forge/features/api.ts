import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";

export interface ScheduledWorkouts {
  workoutId: string;
  scheduledDate: string;
}

export interface CompletedSessions {
  workoutId: string;
  completedAt: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001",

    prepareHeaders: async (headers) => {
      const token = await SecureStore.getItemAsync("token");

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["ScheduledWorkouts", "CompletedSessions"],

  endpoints: (build) => ({
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
        workoutSession: Array<{
          workoutId: string;
          completedAt: string;
          [key: string]: any;
        }>;
      }) => {
        return response.workoutSession.map((session) => ({
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
  }),
});

export const { useGetScheduledWorkoutsQuery, useGetCompletedSessionsQuery } =
  api;
