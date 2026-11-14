import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { auth } from "./lib/auth";
import { reconcileStaleReservations } from "./services/aiUsage/usageManagerservice";
import aiCoachRoutes from "./routes/aiCoachRoutes";
import aiWorkoutRoutes from "./routes/aiWorkoutRoutes";
import exercisesRoutes from "./routes/exercisesRoutes";
import personalRecordsRoutes from "./routes/personalRecordsRoutes";
import profileRoutes from "./routes/profileRoutes";
import scheduledWorkoutsRoutes from "./routes/scheduledWorkoutsRoutes";
import statsRoutes from "./routes/statsRoutes";
import workoutSessionRoutes from "./routes/workoutSessionsRoutes";
import workoutsRoutes from "./routes/workoutsRoutes";

const app = express();

//allows mobile app to send login credentials
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps and curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:8081",
        "exp://",
        "forge://",
        "http://192.168.18.4:3000",
        process.env.EXPO_PUBLIC_API_URL,
      ].filter((origin): origin is string => origin !== undefined);

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("exp://") ||
        origin.startsWith("forge://")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

//MIDDLEWARES
//direct all auth routes to better auth.
app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));

// ROUTES.
app.use("/api/workouts", workoutsRoutes);
app.use("/api/workouts", workoutSessionRoutes);
app.use("/api/performance", statsRoutes);
app.use("/api", exercisesRoutes);
app.use("/api", scheduledWorkoutsRoutes);
app.use("/api", personalRecordsRoutes);
app.use("/api/ai", aiCoachRoutes);
app.use("/api/ai", aiWorkoutRoutes);
app.use("/api/profile", profileRoutes);

const port = process.env.PORT || 3001;

async function startServer() {
  // Refund any AI requests that were left pending by a previous crash/restart
  // before we start accepting new traffic. Failing to do this would leave trial
  // credits permanently consumed.
  try {
    await reconcileStaleReservations();
  } catch (error) {
    console.error(
      "[Startup] Failed to reconcile stale AI requests:",
      error
    );
  }

  app.listen(port, () => {
    console.log("SERVER IS RUNNING LIVE ON PORT:", port);
  });
}

startServer();
