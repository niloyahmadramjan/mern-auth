import express from "express";
const app = express();
import dotenv from "dotenv";
const PORT = process.env.PORT || 5000;
import connnectDb from "./config/db.js";
import { createClient } from "redis";
dotenv.config();
await connnectDb();

// Redis connection
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.log("missing redis url");
  process.exit(1);
}

export const redisClient = createClient({
  url: redisUrl,
});

redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

// middlewares
app.use(express.json());

// importing routes
import userRoutes from "./routes/user.routes.js";

// using routes

app.use("/api/v1", userRoutes);

app.use("/", (req, res) => {
  res.send("server is running...");
});

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
