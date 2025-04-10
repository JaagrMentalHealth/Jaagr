require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./utils/db");
const diseaseRoutes = require("./routes/diseaseRoutes");
const questionRoutes = require("./routes/questionRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const assessmentTypesRoutes=require("./routes/assessmentAdminRoutes")

const assessmentApp = express();

// Connect to MongoDB
connectDB();

// Middleware
assessmentApp.use(express.json());
assessmentApp.use(cors());

assessmentApp.use("/diseases", diseaseRoutes);
assessmentApp.use("/questions", questionRoutes);
assessmentApp.use("/assessment", assessmentRoutes);
assessmentApp.use("/admin",assessmentTypesRoutes)

assessmentApp.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
module.exports = assessmentApp;
