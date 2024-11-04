const mongoose = require("mongoose")
const env = require("dotenv").config();


const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true
      });
      console.log("DB connected successfully.");
    } catch (error) {
      console.error("DB connection failed:", error);
    }
  };
  module.exports = connectDB;
  