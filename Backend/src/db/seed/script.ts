import "dotenv/config";
import { db } from "../index";
import { exercises } from "../schema";
import {
  EXERCISE_DATA_URL,
  EXERCISE_IMAGE_URL,
  EXERCISE_NAMES,
  type SourceExercise,
} from "./exercises";

type ExerciseRow = {
  slug: string;
  name: string;
  description: string;
  muscle: string;
  equipment: string | null;
  difficulty: string;
  forceType: string | null;
  mechanics: string | null;
  category: string;
  userId: null;
};

async function fetchExercises(): Promise<SourceExercise[]> {
  console.log("Fetching exercises from:", EXERCISE_DATA_URL);
  const response = await fetch(EXERCISE_DATA_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch exercises: ${response.status} ${response.statusText}`
    );
  }
  const data = (await response.json()) as SourceExercise[];
  console.log(`Fetched ${data.length} exercises from source`);
  return data;
}

function mapExercise(source: SourceExercise): ExerciseRow {
  const images = source.images ?? [];
  const imageUrl =
    images.length > 0
      ? `${EXERCISE_IMAGE_URL}/${images[0]}`
      : `${EXERCISE_IMAGE_URL}/default.jpg`;

  return {
    slug: source.id,
    name: source.name,
    description: source.name,
    muscle: source.primaryMuscles.join(", "),
    equipment: source.equipment,
    difficulty: source.level,
    forceType: source.force,
    mechanics: source.mechanic,
    category: source.category,
    userId: null,
  };
}

function filterExercises(exercises: SourceExercise[]): SourceExercise[] {
  const wanted = new Set(EXERCISE_NAMES);
  return exercises.filter((ex) => wanted.has(ex.name));
}

async function seedExercises() {
  try {
    const allExercises = await fetchExercises();
    const selected = filterExercises(allExercises);

    if (selected.length === 0) {
      console.warn("No matching exercises found. Check EXERCISE_NAMES.");
      return;
    }

    const rows: ExerciseRow[] = selected.map(mapExercise);

    console.log(`Inserting ${rows.length} exercises...`);

    await db.delete(exercises);

    await db.insert(exercises).values(rows);

    console.log(`Successfully seeded ${rows.length} exercises.`);
  } catch (error) {
    console.error("Error seeding exercises:", error);
    process.exit(1);
  }
}

seedExercises();
