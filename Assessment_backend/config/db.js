const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://onlyforcocindia:ceJzyCscVTpzGxQY@jaagr.p70m1.mongodb.net/?retryWrites=true&w=majority&appName=Jaagr", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Additional options if needed
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
