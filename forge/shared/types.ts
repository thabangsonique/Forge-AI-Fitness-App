export type PRMoment = {
  value: number;
  weight: number;
  reps: number;
  date: Date;
};

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  metricType: "estimated1RM" | "reps";
  currentPR: number;
  prWeight: number;
  prReps: number;
  prDate: Date;
  previousPR: number | null;
  delta: number | null;
  prHistory: PRMoment[];
};

export type PersonalRecordHero = {
  totalPRs: number;
  last30Days: number;
  strongest: PersonalRecord | null;
};

export type PersonalRecordsResponse = {
  success: true;
  hero: PersonalRecordHero;
  records: PersonalRecord[];
};

export type ExerciseSetRow = {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  equipment: string | null;
  weight: number | null;
  reps: number;
  completedAt: Date;
};
