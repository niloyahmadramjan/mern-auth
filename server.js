import express from "express";
const app = express();
import dotenv from "dotenv";
const PORT = process.env.PORT || 5000;
import connnectDb from "./config/db.js";
dotenv.config();
await connnectDb()

// middlewares
app.use(express.json());

// importing routes
import userRoutes from "./routes/user.routes.js";

// using routes

app.use("/api/v1", userRoutes)

app.use("/",(req,res)=>{
  res.send("server is running...")
})


app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
