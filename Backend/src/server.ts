import "dotenv/config"
import express from "express";
import cors from "cors"
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";



const app = express();


//allows mobile app to send login credentials
app.use(cors({
  origin: [
    "http://localhost:8081", "exp://", "forge://"
  ], credentials: true,
}))

//direct all auth routes to better auth.
app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())

//MIDDLEWARE

//ROUTES.

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log("SERVER IS RUNNING LIVE ON PORT:", port);
});
