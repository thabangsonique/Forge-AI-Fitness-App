import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    expo(),
    bearer(), // Enables seamless React Native / Expo integration & deep-linking
  ],
  trustedOrigins: [
    "forge://", // Your app's custom scheme from app.json
    "exp://", // Expo Go development scheme
    "http://localhost:8081", // Expo Web bundler
    "http://localhost:3000",
    "http://192.168.18.4:3000",
  ],
});
