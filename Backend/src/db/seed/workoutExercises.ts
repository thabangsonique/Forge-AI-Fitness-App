export type WorkoutExerciseSeedData = {
  workoutName: string;
  exercises: {
    exerciseName: string;
    position: number;
    restSeconds: number;
    sets: number;
    reps: number;
  }[];
};

export const WORKOUT_EXERCISE_SEED_DATA: WorkoutExerciseSeedData[] = [
  {
    workoutName: "Push Day",
    exercises: [
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        position: 1,
        restSeconds: 120,
        sets: 4,
        reps: 8,
      },
      {
        exerciseName: "Standing Military Press",
        position: 2,
        restSeconds: 120,
        sets: 3,
        reps: 8,
      },
      {
        exerciseName: "Side Lateral Raise",
        position: 3,
        restSeconds: 60,
        sets: 3,
        reps: 12,
      },
      {
        exerciseName: "Triceps Pushdown",
        position: 4,
        restSeconds: 60,
        sets: 3,
        reps: 12,
      },
      {
        exerciseName: "Pushups",
        position: 5,
        restSeconds: 60,
        sets: 3,
        reps: 15,
      },
    ],
  },

  {
    workoutName: "Pull Day",
    exercises: [
      {
        exerciseName: "Barbell Deadlift",
        position: 1,
        restSeconds: 180,
        sets: 3,
        reps: 5,
      },
      {
        exerciseName: "Pullups",
        position: 2,
        restSeconds: 120,
        sets: 4,
        reps: 8,
      },
      {
        exerciseName: "Wide-Grip Lat Pulldown",
        position: 3,
        restSeconds: 90,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Seated Cable Rows",
        position: 4,
        restSeconds: 90,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Barbell Curl",
        position: 5,
        restSeconds: 60,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Hammer Curls",
        position: 6,
        restSeconds: 60,
        sets: 3,
        reps: 12,
      },
    ],
  },

  {
    workoutName: "Leg Day",
    exercises: [
      {
        exerciseName: "Barbell Squat",
        position: 1,
        restSeconds: 180,
        sets: 4,
        reps: 8,
      },
      {
        exerciseName: "Romanian Deadlift",
        position: 2,
        restSeconds: 120,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Leg Press",
        position: 3,
        restSeconds: 120,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Leg Extensions",
        position: 4,
        restSeconds: 90,
        sets: 3,
        reps: 12,
      },
      {
        exerciseName: "Lying Leg Curls",
        position: 5,
        restSeconds: 90,
        sets: 3,
        reps: 12,
      },
      {
        exerciseName: "Standing Calf Raises",
        position: 6,
        restSeconds: 60,
        sets: 4,
        reps: 15,
      },
    ],
  },

  {
    workoutName: "Upper Body",
    exercises: [
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        position: 1,
        restSeconds: 120,
        sets: 4,
        reps: 8,
      },
      {
        exerciseName: "Pullups",
        position: 2,
        restSeconds: 120,
        sets: 4,
        reps: 8,
      },
      {
        exerciseName: "Standing Military Press",
        position: 3,
        restSeconds: 90,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Seated Cable Rows",
        position: 4,
        restSeconds: 90,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Barbell Curl",
        position: 5,
        restSeconds: 60,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Triceps Pushdown",
        position: 6,
        restSeconds: 60,
        sets: 3,
        reps: 12,
      },
    ],
  },

  {
    workoutName: "Full Body",
    exercises: [
      {
        exerciseName: "Barbell Squat",
        position: 1,
        restSeconds: 150,
        sets: 3,
        reps: 8,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        position: 2,
        restSeconds: 120,
        sets: 3,
        reps: 8,
      },
      {
        exerciseName: "Barbell Deadlift",
        position: 3,
        restSeconds: 180,
        sets: 3,
        reps: 5,
      },
      {
        exerciseName: "Standing Military Press",
        position: 4,
        restSeconds: 90,
        sets: 3,
        reps: 10,
      },
      {
        exerciseName: "Pullups",
        position: 5,
        restSeconds: 120,
        sets: 3,
        reps: 8,
      },
      {
        exerciseName: "Dumbbell Lunges",
        position: 6,
        restSeconds: 90,
        sets: 3,
        reps: 10,
      },
    ],
  },
];
