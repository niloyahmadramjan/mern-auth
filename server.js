import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connect
connectDb();

// Redis connect
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.log("missing redis url");
  process.exit(1);
}

export const redisClient = createClient({ url: redisUrl });
await redisClient.connect();
console.log("connected to redis");

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTION"]

}))
// Routes
app.use("/api/v1", userRoutes);

app.use("/", (req, res) => res.send("server is running..."));

// Server listen
app.listen(PORT, () =>
  console.log(`server running on http://localhost:${PORT}`)
);
