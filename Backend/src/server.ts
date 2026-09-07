import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

//MIDDLEWARE

//ROUTES.

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log("SERVER IS RUNNING LIVE ON PORT:", port);
});
