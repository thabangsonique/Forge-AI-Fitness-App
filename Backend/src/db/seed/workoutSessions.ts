export type WorkoutSessionSeedData = {
  workoutName: string;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;

  sets: {
    exerciseName: string;
    setNumber: number;
    reps: number;
    weight: number;
  }[];
};

export const WORKOUT_SESSION_SEED_DATA: WorkoutSessionSeedData[] = [
  // --------------------------------------------------
  // PUSH DAY - SEPTEMBER 15
  // --------------------------------------------------

  {
    workoutName: "Push Day",

    startedAt: new Date("2026-09-15T17:30:00+02:00"),
    completedAt: new Date("2026-09-15T18:32:00+02:00"),
    durationSeconds: 3720,

    sets: [
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 1,
        reps: 8,
        weight: 80,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 2,
        reps: 8,
        weight: 80,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 3,
        reps: 7,
        weight: 80,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 4,
        reps: 6,
        weight: 80,
      },

      {
        exerciseName: "Standing Military Press",
        setNumber: 1,
        reps: 8,
        weight: 50,
      },
      {
        exerciseName: "Standing Military Press",
        setNumber: 2,
        reps: 8,
        weight: 50,
      },
      {
        exerciseName: "Standing Military Press",
        setNumber: 3,
        reps: 7,
        weight: 50,
      },

      {
        exerciseName: "Side Lateral Raise",
        setNumber: 1,
        reps: 12,
        weight: 12,
      },
      {
        exerciseName: "Side Lateral Raise",
        setNumber: 2,
        reps: 12,
        weight: 12,
      },
      {
        exerciseName: "Side Lateral Raise",
        setNumber: 3,
        reps: 10,
        weight: 12,
      },

      {
        exerciseName: "Triceps Pushdown",
        setNumber: 1,
        reps: 12,
        weight: 30,
      },
      {
        exerciseName: "Triceps Pushdown",
        setNumber: 2,
        reps: 12,
        weight: 30,
      },
      {
        exerciseName: "Triceps Pushdown",
        setNumber: 3,
        reps: 11,
        weight: 30,
      },

      {
        exerciseName: "Pushups",
        setNumber: 1,
        reps: 15,
        weight: 0,
      },
      {
        exerciseName: "Pushups",
        setNumber: 2,
        reps: 14,
        weight: 0,
      },
      {
        exerciseName: "Pushups",
        setNumber: 3,
        reps: 12,
        weight: 0,
      },
    ],
  },

  // --------------------------------------------------
  // PULL DAY - SEPTEMBER 12
  // --------------------------------------------------

  {
    workoutName: "Pull Day",

    startedAt: new Date("2026-09-12T16:45:00+02:00"),
    completedAt: new Date("2026-09-12T17:55:00+02:00"),
    durationSeconds: 4200,

    sets: [
      {
        exerciseName: "Barbell Deadlift",
        setNumber: 1,
        reps: 5,
        weight: 140,
      },
      {
        exerciseName: "Barbell Deadlift",
        setNumber: 2,
        reps: 5,
        weight: 140,
      },
      {
        exerciseName: "Barbell Deadlift",
        setNumber: 3,
        reps: 4,
        weight: 140,
      },

      {
        exerciseName: "Pullups",
        setNumber: 1,
        reps: 8,
        weight: 0,
      },
      {
        exerciseName: "Pullups",
        setNumber: 2,
        reps: 8,
        weight: 0,
      },
      {
        exerciseName: "Pullups",
        setNumber: 3,
        reps: 7,
        weight: 0,
      },
      {
        exerciseName: "Pullups",
        setNumber: 4,
        reps: 6,
        weight: 0,
      },

      {
        exerciseName: "Wide-Grip Lat Pulldown",
        setNumber: 1,
        reps: 10,
        weight: 65,
      },
      {
        exerciseName: "Wide-Grip Lat Pulldown",
        setNumber: 2,
        reps: 10,
        weight: 65,
      },
      {
        exerciseName: "Wide-Grip Lat Pulldown",
        setNumber: 3,
        reps: 9,
        weight: 65,
      },

      {
        exerciseName: "Seated Cable Rows",
        setNumber: 1,
        reps: 10,
        weight: 60,
      },
      {
        exerciseName: "Seated Cable Rows",
        setNumber: 2,
        reps: 10,
        weight: 60,
      },
      {
        exerciseName: "Seated Cable Rows",
        setNumber: 3,
        reps: 9,
        weight: 60,
      },

      {
        exerciseName: "Barbell Curl",
        setNumber: 1,
        reps: 10,
        weight: 35,
      },
      {
        exerciseName: "Barbell Curl",
        setNumber: 2,
        reps: 10,
        weight: 35,
      },
      {
        exerciseName: "Barbell Curl",
        setNumber: 3,
        reps: 9,
        weight: 35,
      },

      {
        exerciseName: "Hammer Curls",
        setNumber: 1,
        reps: 12,
        weight: 16,
      },
      {
        exerciseName: "Hammer Curls",
        setNumber: 2,
        reps: 11,
        weight: 16,
      },
      {
        exerciseName: "Hammer Curls",
        setNumber: 3,
        reps: 10,
        weight: 16,
      },
    ],
  },

  // --------------------------------------------------
  // LEG DAY - SEPTEMBER 10
  // --------------------------------------------------

  {
    workoutName: "Leg Day",

    startedAt: new Date("2026-09-10T17:15:00+02:00"),
    completedAt: new Date("2026-09-10T18:28:00+02:00"),
    durationSeconds: 4380,

    sets: [
      {
        exerciseName: "Barbell Squat",
        setNumber: 1,
        reps: 8,
        weight: 100,
      },
      {
        exerciseName: "Barbell Squat",
        setNumber: 2,
        reps: 8,
        weight: 100,
      },
      {
        exerciseName: "Barbell Squat",
        setNumber: 3,
        reps: 7,
        weight: 100,
      },
      {
        exerciseName: "Barbell Squat",
        setNumber: 4,
        reps: 6,
        weight: 100,
      },

      {
        exerciseName: "Romanian Deadlift",
        setNumber: 1,
        reps: 10,
        weight: 90,
      },
      {
        exerciseName: "Romanian Deadlift",
        setNumber: 2,
        reps: 10,
        weight: 90,
      },
      {
        exerciseName: "Romanian Deadlift",
        setNumber: 3,
        reps: 9,
        weight: 90,
      },

      {
        exerciseName: "Leg Press",
        setNumber: 1,
        reps: 10,
        weight: 180,
      },
      {
        exerciseName: "Leg Press",
        setNumber: 2,
        reps: 10,
        weight: 180,
      },
      {
        exerciseName: "Leg Press",
        setNumber: 3,
        reps: 10,
        weight: 180,
      },

      {
        exerciseName: "Leg Extensions",
        setNumber: 1,
        reps: 12,
        weight: 55,
      },
      {
        exerciseName: "Leg Extensions",
        setNumber: 2,
        reps: 12,
        weight: 55,
      },
      {
        exerciseName: "Leg Extensions",
        setNumber: 3,
        reps: 11,
        weight: 55,
      },

      {
        exerciseName: "Lying Leg Curls",
        setNumber: 1,
        reps: 12,
        weight: 50,
      },
      {
        exerciseName: "Lying Leg Curls",
        setNumber: 2,
        reps: 12,
        weight: 50,
      },
      {
        exerciseName: "Lying Leg Curls",
        setNumber: 3,
        reps: 10,
        weight: 50,
      },

      {
        exerciseName: "Standing Calf Raises",
        setNumber: 1,
        reps: 15,
        weight: 80,
      },
      {
        exerciseName: "Standing Calf Raises",
        setNumber: 2,
        reps: 15,
        weight: 80,
      },
      {
        exerciseName: "Standing Calf Raises",
        setNumber: 3,
        reps: 14,
        weight: 80,
      },
      {
        exerciseName: "Standing Calf Raises",
        setNumber: 4,
        reps: 12,
        weight: 80,
      },
    ],
  },

  // --------------------------------------------------
  // PUSH DAY - SEPTEMBER 8
  // --------------------------------------------------

  {
    workoutName: "Push Day",

    startedAt: new Date("2026-09-08T18:00:00+02:00"),
    completedAt: new Date("2026-09-08T18:58:00+02:00"),
    durationSeconds: 3480,

    sets: [
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 1,
        reps: 8,
        weight: 77.5,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 2,
        reps: 8,
        weight: 77.5,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 3,
        reps: 8,
        weight: 77.5,
      },
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        setNumber: 4,
        reps: 7,
        weight: 77.5,
      },

      {
        exerciseName: "Standing Military Press",
        setNumber: 1,
        reps: 8,
        weight: 47.5,
      },
      {
        exerciseName: "Standing Military Press",
        setNumber: 2,
        reps: 8,
        weight: 47.5,
      },
      {
        exerciseName: "Standing Military Press",
        setNumber: 3,
        reps: 8,
        weight: 47.5,
      },

      {
        exerciseName: "Side Lateral Raise",
        setNumber: 1,
        reps: 12,
        weight: 10,
      },
      {
        exerciseName: "Side Lateral Raise",
        setNumber: 2,
        reps: 12,
        weight: 10,
      },
      {
        exerciseName: "Side Lateral Raise",
        setNumber: 3,
        reps: 12,
        weight: 10,
      },

      {
        exerciseName: "Triceps Pushdown",
        setNumber: 1,
        reps: 12,
        weight: 27.5,
      },
      {
        exerciseName: "Triceps Pushdown",
        setNumber: 2,
        reps: 12,
        weight: 27.5,
      },
      {
        exerciseName: "Triceps Pushdown",
        setNumber: 3,
        reps: 12,
        weight: 27.5,
      },

      {
        exerciseName: "Pushups",
        setNumber: 1,
        reps: 15,
        weight: 0,
      },
      {
        exerciseName: "Pushups",
        setNumber: 2,
        reps: 15,
        weight: 0,
      },
      {
        exerciseName: "Pushups",
        setNumber: 3,
        reps: 14,
        weight: 0,
      },
    ],
  },

  // --------------------------------------------------
  // PULL DAY - SEPTEMBER 5
  // --------------------------------------------------

  {
    workoutName: "Pull Day",

    startedAt: new Date("2026-09-05T10:00:00+02:00"),
    completedAt: new Date("2026-09-05T11:06:00+02:00"),
    durationSeconds: 3960,

    sets: [
      {
        exerciseName: "Barbell Deadlift",
        setNumber: 1,
        reps: 5,
        weight: 135,
      },
      {
        exerciseName: "Barbell Deadlift",
        setNumber: 2,
        reps: 5,
        weight: 135,
      },
      {
        exerciseName: "Barbell Deadlift",
        setNumber: 3,
        reps: 5,
        weight: 135,
      },

      {
        exerciseName: "Pullups",
        setNumber: 1,
        reps: 8,
        weight: 0,
      },
      {
        exerciseName: "Pullups",
        setNumber: 2,
        reps: 7,
        weight: 0,
      },
      {
        exerciseName: "Pullups",
        setNumber: 3,
        reps: 7,
        weight: 0,
      },
      {
        exerciseName: "Pullups",
        setNumber: 4,
        reps: 6,
        weight: 0,
      },

      {
        exerciseName: "Wide-Grip Lat Pulldown",
        setNumber: 1,
        reps: 10,
        weight: 60,
      },
      {
        exerciseName: "Wide-Grip Lat Pulldown",
        setNumber: 2,
        reps: 10,
        weight: 60,
      },
      {
        exerciseName: "Wide-Grip Lat Pulldown",
        setNumber: 3,
        reps: 10,
        weight: 60,
      },

      {
        exerciseName: "Seated Cable Rows",
        setNumber: 1,
        reps: 10,
        weight: 55,
      },
      {
        exerciseName: "Seated Cable Rows",
        setNumber: 2,
        reps: 10,
        weight: 55,
      },
      {
        exerciseName: "Seated Cable Rows",
        setNumber: 3,
        reps: 10,
        weight: 55,
      },

      {
        exerciseName: "Barbell Curl",
        setNumber: 1,
        reps: 10,
        weight: 32.5,
      },
      {
        exerciseName: "Barbell Curl",
        setNumber: 2,
        reps: 10,
        weight: 32.5,
      },
      {
        exerciseName: "Barbell Curl",
        setNumber: 3,
        reps: 10,
        weight: 32.5,
      },

      {
        exerciseName: "Hammer Curls",
        setNumber: 1,
        reps: 12,
        weight: 14,
      },
      {
        exerciseName: "Hammer Curls",
        setNumber: 2,
        reps: 12,
        weight: 14,
      },
      {
        exerciseName: "Hammer Curls",
        setNumber: 3,
        reps: 11,
        weight: 14,
      },
    ],
  },

  // --------------------------------------------------
  // LEG DAY - SEPTEMBER 3
  // --------------------------------------------------

  {
    workoutName: "Leg Day",

    startedAt: new Date("2026-09-03T17:30:00+02:00"),
    completedAt: new Date("2026-09-03T18:40:00+02:00"),
    durationSeconds: 4200,

    sets: [
      {
        exerciseName: "Barbell Squat",
        setNumber: 1,
        reps: 8,
        weight: 95,
      },
      {
        exerciseName: "Barbell Squat",
        setNumber: 2,
        reps: 8,
        weight: 95,
      },
      {
        exerciseName: "Barbell Squat",
        setNumber: 3,
        reps: 8,
        weight: 95,
      },
      {
        exerciseName: "Barbell Squat",
        setNumber: 4,
        reps: 7,
        weight: 95,
      },

      {
        exerciseName: "Romanian Deadlift",
        setNumber: 1,
        reps: 10,
        weight: 85,
      },
      {
        exerciseName: "Romanian Deadlift",
        setNumber: 2,
        reps: 10,
        weight: 85,
      },
      {
        exerciseName: "Romanian Deadlift",
        setNumber: 3,
        reps: 10,
        weight: 85,
      },

      {
        exerciseName: "Leg Press",
        setNumber: 1,
        reps: 10,
        weight: 170,
      },
      {
        exerciseName: "Leg Press",
        setNumber: 2,
        reps: 10,
        weight: 170,
      },
      {
        exerciseName: "Leg Press",
        setNumber: 3,
        reps: 9,
        weight: 170,
      },

      {
        exerciseName: "Leg Extensions",
        setNumber: 1,
        reps: 12,
        weight: 50,
      },
      {
        exerciseName: "Leg Extensions",
        setNumber: 2,
        reps: 12,
        weight: 50,
      },
      {
        exerciseName: "Leg Extensions",
        setNumber: 3,
        reps: 12,
        weight: 50,
      },

      {
        exerciseName: "Lying Leg Curls",
        setNumber: 1,
        reps: 12,
        weight: 45,
      },
      {
        exerciseName: "Lying Leg Curls",
        setNumber: 2,
        reps: 12,
        weight: 45,
      },
      {
        exerciseName: "Lying Leg Curls",
        setNumber: 3,
        reps: 11,
        weight: 45,
      },

      {
        exerciseName: "Standing Calf Raises",
        setNumber: 1,
        reps: 15,
        weight: 70,
      },
      {
        exerciseName: "Standing Calf Raises",
        setNumber: 2,
        reps: 15,
        weight: 70,
      },
      {
        exerciseName: "Standing Calf Raises",
        setNumber: 3,
        reps: 15,
        weight: 70,
      },
      {
        exerciseName: "Standing Calf Raises",
        setNumber: 4,
        reps: 14,
        weight: 70,
      },
    ],
  },
];
