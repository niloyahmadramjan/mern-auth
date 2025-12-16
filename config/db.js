import mongoose from "mongoose";

const connnectDb = async()=>{
    try {
        await mongoose.connect(process.env.MONOG_URI,{
            dbName: "MernAuthentication",
        })
        console.log("db is connected successfully")
    } catch (error) {
        console.log("DB connection faild")
    }
}

export default connnectDb;