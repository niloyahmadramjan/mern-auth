import mongoose from "mongoose";

const connnectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "authdb",
    });
    console.log("db is connected successfully");
  } catch (error) {
    console.log("DB connection faild");
  }
};

export default connnectDb;
