const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const otpRoutes = require("./routes/otpRoutes");
const { sendOtp, verifyOtp } = require("./controllers/otpController"); // Corrected import
const assessmentRoutes=require("./routes/assessmentRoutes")

const userRoutes = require("./routes/userRoutes");
const blogRoutes = require("./routes/blogRoutes");
const errorHandler = require("./middleware/errorHandler");
const adminApp = require("./admin_application/adminServer");
const assessmentApp=require("./assessment_v2/assessment")
const contactRouter=require("./routes/contactRoutes")
const paymentRouter=require("./routes/paymentRoutes")

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/assessment",assessmentRoutes)
app.use("/api/contact",contactRouter)
// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

app.get('/api/payment',paymentRouter)

app.use("/admin",adminApp)
app.use("/assessment",assessmentApp)

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((conn) => console.log(`Connected to MongoDB ${conn.connection.host}`))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
