const MUSCLE_ALIASES: Record<string, string[]> = {
  back: ["back", "lats", "middle back", "upper back", "lower back", "trapezius"],
  lats: ["lats", "back"],
  "middle back": ["middle back", "upper back", "back"],
  arms: ["arms", "biceps", "triceps", "forearms"],
  legs: ["legs", "quadriceps", "hamstrings", "glutes", "calves"],
  quads: ["quads", "quadriceps"],
  quadriceps: ["quadriceps", "quads"],
  shoulders: ["shoulders", "deltoids", "front deltoids", "side deltoids", "rear deltoids"],
  deltoids: ["deltoids", "shoulders", "front deltoids", "side deltoids", "rear deltoids"],
  glute: ["glute", "glutes"],
  hamstring: ["hamstring", "hamstrings"],
  chest: ["chest", "pectorals"],
};

export const expandMuscleAliases = (muscles: string[]): string[] =>
  [...new Set(muscles.flatMap((muscle) => {
    const normalized = muscle.trim().toLowerCase().replace(/[_-]/g, " ");
    const grouped = normalized.match(/^([^()]+)\(([^)]+)\)$/);
    const labels = grouped
      ? [grouped[1].trim(), ...grouped[2].split(/,|\band\b/).map((part) => part.trim())]
      : [normalized];
    return labels.flatMap((label) => MUSCLE_ALIASES[label] ?? [label]);
  }).filter(Boolean))];

export const muscleMatchesPriority = (exerciseMuscle: string, priority: string): boolean => {
  const normalizedExercise = exerciseMuscle.trim().toLowerCase().replace(/[_-]/g, " ");
  return expandMuscleAliases([priority]).includes(normalizedExercise);
};

export const requiredMuscleComponents = (priority: string): string[] => {
  const normalized = priority.trim().toLowerCase().replace(/[_-]/g, " ");
  const grouped = normalized.match(/^([^()]+)\(([^)]+)\)$/);
  if (!grouped) return [normalized];
  return [...new Set(grouped[2].split(/,|\band\b/).map((part) => part.trim()).filter(Boolean))];
};

export const missingCandidatePriorities = (
  priorities: string[],
  candidateMuscles: string[]
): string[] => priorities.flatMap((priority) => {
  const missing = requiredMuscleComponents(priority).filter(
    (component) => !candidateMuscles.some((candidateMuscle) => muscleMatchesPriority(candidateMuscle, component))
  );
  return missing.length ? [`${priority}${priority.includes("(") ? ` (missing: ${missing.join(", ")})` : ""}`] : [];
});
