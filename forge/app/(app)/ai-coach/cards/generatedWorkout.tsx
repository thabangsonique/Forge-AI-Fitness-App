import { AiWorkoutDraftResponse } from "@/features/api";
import React from "react";
import { Text, View } from "react-native";

interface GenerateWorkoutProps {
  generatedWorkout: AiWorkoutDraftResponse;
}

export default function GeneratedWorkout({
  generatedWorkout,
}: GenerateWorkoutProps) {
  const workout = generatedWorkout?.data?.workout;
  const exercises = workout?.exercises ?? [];

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(generatedWorkout?.data?.createdAt ?? Date.now()));

  return (
    <View className="overflow-hidden rounded-3xl border border-primary/20 bg-muted/10">
      {/* Workout Header */}
      <View className="border-b border-white/10 p-5">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">
            AI Generated Workout
          </Text>
        </View>

        <Text className="text-2xl font-bold text-white">{workout?.name}</Text>

        <Text className="mt-2 text-sm font-semibold text-primary">
          {workout?.category}
        </Text>

        <Text className="mt-3 text-sm leading-6 text-muted-2">
          {workout?.description}
        </Text>
      </View>

      {/* Workout Statistics */}
      <View className="flex-row border-b border-white/10">
        <View className="flex-1 items-center p-4">
          <Text className="text-2xl font-bold text-white">
            {exercises.length}
          </Text>
          <Text className="mt-1 text-xs text-muted-2">Exercises</Text>
        </View>

        <View className="w-px bg-white/10" />

        <View className="flex-1 items-center p-4">
          <Text className="text-2xl font-bold text-white">{formattedDate}</Text>
          <Text className="mt-1 text-xs text-muted-2">Generated</Text>
        </View>
      </View>

      {/* Exercise Breakdown */}
      <View className="p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-white">
            Exercise Breakdown
          </Text>

          <Text className="text-xs text-muted-2">{exercises.length} total</Text>
        </View>

        {exercises.length > 0 ? (
          exercises.map((exercise, index) => (
            <View
              key={exercise.exerciseId || `${exercise.exerciseName}-${index}`}
              className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <Text className="text-base font-bold text-white">
                {index + 1}. {exercise.exerciseName}
              </Text>

              <Text className="mt-1 text-xs text-primary">
                {exercise.muscle}
              </Text>

              <View className="mt-4 flex-row justify-between">
                <View>
                  <Text className="text-xs text-muted-2">Sets</Text>
                  <Text className="mt-1 font-bold text-white">
                    {exercise.sets}
                  </Text>
                </View>

                <View>
                  <Text className="text-xs text-muted-2">Reps</Text>
                  <Text className="mt-1 font-bold text-white">
                    {exercise.reps}
                  </Text>
                </View>

                <View>
                  <Text className="text-xs text-muted-2">Rest</Text>
                  <Text className="mt-1 font-bold text-white">
                    {exercise.restSeconds}s
                  </Text>
                </View>
              </View>

              {exercise.coachingTip ? (
                <View className="mt-4 border-t border-white/10 pt-3">
                  <Text className="text-xs font-bold text-primary">
                    COACHING TIP
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-muted-2">
                    {exercise.coachingTip}
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View className="items-center rounded-2xl border border-dashed border-white/20 px-5 py-8">
            <Text className="text-base font-bold text-white">
              No exercises available yet
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-muted-2">
              Your workout plan has been created, but no exercises were
              returned. Try generating the workout again.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
