require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const assessmentApp = express();

// Connect to MongoDB
connectDB();

// Middleware
assessmentApp.use(express.json());
assessmentApp.use(cors());

// Route handlers
assessmentApp.use('/api/diseases', require('./routes/diseaseRoutes'));
assessmentApp.use('/api/symptoms', require('./routes/symptomRoutes'));
assessmentApp.use('/api/questions', require('./routes/questionRoutes'));
assessmentApp.use('/api/diagnose', require('./routes/diagnosisRoutes'));

// Global Error Handler (optional)
assessmentApp.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
module.exports=assessmentApp;