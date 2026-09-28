export const SEED_USER_ID = "V0KkDCsOI1ORj2cP366odmYgVwJMm13M";

// ============================================================
// WORKOUT TEMPLATES
// Each workout has a name, description, and the day index
// it's scheduled for (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
// ============================================================
export interface SeedWorkout {
  name: string;
  description: string;
  dayIndex: number;
}

export const WORKOUT_SEED_DATA: SeedWorkout[] = [
  {
    name: "Push Day",
    description: "Chest - Shoulders - Triceps",
    dayIndex: 1, // Monday
  },
  {
    name: "Pull Day",
    description: "Back - Biceps",
    dayIndex: 2, // Tuesday
  },
  {
    name: "Leg Day",
    description: "Quads - Hamstrings - Calves",
    dayIndex: 3, // Wednesday
  },
  {
    name: "Full Body",
    description: "Full body workout",
    dayIndex: 5, // Friday
  },
  {
    name: "Cardio",
    description: "Cardio session",
    dayIndex: 6, // Saturday
  },
];
