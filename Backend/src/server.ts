import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import "dotenv/config";
import { eq } from "drizzle-orm";
import express from "express";
import { db } from "./db";
import { profiles } from "./db/schema";
import { auth } from "./lib/auth";
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

//STAND ALONE.
//profile routes.
app.post("/api/profile", async (req, res) => {
  // Debug: log request details
  console.log("PROFILE REQUEST - headers:", JSON.stringify(req.headers));
  console.log("PROFILE REQUEST - body:", JSON.stringify(req.body));

  try {
    // get user session.
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    console.log("HERE IS THE SESSION TOKEN:", session);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized- no token found." });
    }

    //grab data from the body.
    const { gender, experience, goal } = req.body;

    if (!gender || !experience || !goal) {
      return res.status(400).json({ error: "Missing fields are required." });
    }

    //check if user exists in profiles table.
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    });

    if (existingProfile) {
      return res.status(200).json({ success: true, existingProfile });
    }

    //create profile if it doesnt exist.
    const [newProfile] = await db
      .insert(profiles)
      .values({
        gender,
        experience,
        goal,
        userId: session.user.id,
      })
      .returning();

    return res.status(200).json({ success: true, profile: newProfile });
  } catch (error: any) {
    console.error("Error creating profile", error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log("SERVER IS RUNNING LIVE ON PORT:", port);
});
