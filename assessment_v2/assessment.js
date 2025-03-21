require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const diseaseRoutes = require("./routes/diseaseRoutes");
const questionRoutes = require("./routes/questionRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

const assessmentApp = express();

// Connect to MongoDB
connectDB();

// Middleware
assessmentApp.use(express.json());
assessmentApp.use(cors());


app.use("/diseases", diseaseRoutes);
app.use("/questions", questionRoutes);
app.use("/assessment", assessmentRoutes);


assessmentApp.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
  });
  
  // Start the server
  module.exports=assessmentApp;