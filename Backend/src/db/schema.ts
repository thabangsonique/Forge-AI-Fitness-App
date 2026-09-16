import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

//custom tables.
//define enumns.
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const goalEnum = pgEnum("goal", [
  "build muscle",
  "lose fat",
  "gain strength",
]);
export const experienceEnum = pgEnum("experience", [
  "beginner",
  "intermediate",
  "advanced",
]);
export const weightUnitEnum = pgEnum("weight_unit", ["kg", "lb"]);

export const profiles = pgTable("profiles", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  gender: genderEnum().notNull(),
  goal: goalEnum().notNull(),
  experience: experienceEnum().notNull(),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

//all the workouts - created by the user.
export const workouts = pgTable("workouts", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text().notNull(),
  description: text(),
  isTemplate: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

//user's ability to schedule workouts.
export const scheduledWorkouts = pgTable("scheduled_workouts", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workoutId: uuid()
    .notNull()
    .references(() => workouts.id),
  scheduledDate: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
});

//all exercises the user will choose from.
export const exercises = pgTable("exercises", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text().references(() => user.id, { onDelete: "cascade" }),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text().notNull(),
  muscle: text().notNull(),
  equipment: text(),
  difficulty: text().notNull(),
  forceType: text(),
  mechanics: text(),
  category: text().notNull(),
});

//table linking workouts to exercises.-workout creation joining table.
export const workoutExercises = pgTable("workout_exercises", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workoutId: uuid()
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid()
    .notNull()
    .references(() => exercises.id),
  position: integer().notNull(),
  restSeconds: integer().notNull(),
  sets: integer().notNull(),
  reps: integer().notNull(),
});

//table tracking the user's workout history session.
export const workoutSession = pgTable("workout_session", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id),
  workoutId: uuid()
    .notNull()
    .references(() => workouts.id),
  startedtAt: timestamp({ withTimezone: true }).notNull(),
  completedAt: timestamp({ withTimezone: true }).notNull(),
  durationSeconds: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

//user's workout session history. in detail.
export const workoutSessionSets = pgTable("workout_session_sets", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  sessionId: uuid()
    .notNull()
    .references(() => workoutSession.id),
  exerciseId: uuid()
    .notNull()
    .references(() => exercises.id),
  setNumber: integer().notNull(),
  reps: integer().notNull(),
  weight: real(),
});

export type Exercise = typeof exercises.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type WorkoutSession = typeof workoutSession.$inferSelect;
export type WorkoutSessionSets = typeof workoutSessionSets.$inferSelect;
