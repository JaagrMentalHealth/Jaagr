const express = require("express");
const authRoutes = require("./routes/authRoutes");
const adminRoutes =require("./routes/adminRoutes")
const organisationRoutes=require("./routes/organisation.routes")
const assessmentRoutes=require("./routes/assessmentRoutes")
const orgUsers=require("./routes/orgUser")

const adminApp = express();
adminApp.use(express.json());


adminApp.use("/auth", authRoutes);
adminApp.use("/api",adminRoutes);
adminApp.use("/organizations",organisationRoutes)
adminApp.use("/assessment",assessmentRoutes)
adminApp.use("/org-users",orgUsers)

module.exports = adminApp;
