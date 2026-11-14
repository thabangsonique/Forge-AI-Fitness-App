import {
  boolean,
  date,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired",
]);

export const aiWorkoutDraftStatusEnum = pgEnum("ai_workout_draft_status", [
  "draft",
  "saved",
  "discarded",
]);

export const aiFeatureEnum = pgEnum("ai_feature", [
  "coach_insight",
  "workout_generation",
]);

export const aiGenerationStatusEnum = pgEnum("ai_generation_status", [
  "pending",
  "success",
  "failed",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

//AI TABLES
//user-subscription

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

//user-trial
export const usageAiTrials = pgTable("usage_ai_trials", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  trialEnds: timestamp({ withTimezone: true }).notNull(),
  workoutGenerationsUsed: integer("workout_generations_used")
    .notNull()
    .default(0),
  insightsUsed: integer("insights_used").notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

//user-insight
export const aiInsights = pgTable("ai_insights", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lastWorkoutSessionId: uuid("last_workout_session_id").references(
    () => workoutSession.id
  ),
  fingerprint: text("fingerprint").notNull(),
  data: json("data").notNull(),
  generatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

//ai generated workouts - store draft workouts
export const aiGeneratedWorkouts = pgTable("ai_generated_workouts", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  targetMuscles: jsonb("target_muscles").$type<string[]>().notNull(),
  status: aiWorkoutDraftStatusEnum("status").notNull().default("draft"),
  workoutData: jsonb("workout_data").notNull(),
  savedWorkoutId: uuid("saved_workout_id").references(() => workouts.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

//ai-usage events
export const aiUsageEvents = pgTable("ai_usage_events", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  feature: aiFeatureEnum("feature").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
  status: aiGenerationStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

//aiGlobalUsageDaily - cap daily on bill for all users
export const aiGlobalUsageDaily = pgTable("ai_global_usage_daily", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  date: date("date").notNull().unique(),
  totalRequests: integer("total_requests").notNull().default(0),
  insightRequests: integer("insight_requests").notNull().default(0),
  workoutRequests: integer("workout_requests").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
export const workoutTypeEnum = pgEnum("workoutType", ["system", "user"]);
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
    .unique("profiles_user_id_unique")
    .references(() => user.id, { onDelete: "cascade" }),
  gender: genderEnum().notNull(),
  goal: goalEnum().notNull(),
  experience: experienceEnum().notNull(),
  workoutsPerWeek: integer("workouts_per_week").notNull().default(4),
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
  userId: text().references(() => user.id, { onDelete: "cascade" }),
  name: text().notNull(),

  description: text(),
  workoutType: workoutTypeEnum().notNull().default("user"),
  image: text(),
  category: text(),
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
  image: text(),
  instruction: jsonb().$type<string[]>().notNull().default([]),

  tips: jsonb().$type<string[]>().notNull().default([]),
  commonMistakes: jsonb().$type<string[]>().notNull().default([]),
});

//table linking workouts to exercises.-workout creation joining table.
export const workoutExercises = pgTable("workout_exercises", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text().references(() => user.id, { onDelete: "cascade" }),
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
