const csv = require("csv-parser");
const OrgUser = require("../models/orgUser");
const fs=require("fs")
const {Mailer}=require("../../utils/mailer")
require('dotenv')

// Create single user
exports.createOrgUser = async (req, res) => {
  try {
    const user = await OrgUser.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users for an organization
exports.getOrgUsersByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const users = await OrgUser.find({ organizationId: orgId });
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user by ID
exports.getOrgUserById = async (req, res) => {
  try {
    const user = await OrgUser.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update user by ID
exports.updateOrgUser = async (req, res) => {
  try {
    const user = await OrgUser.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user by ID
exports.deleteOrgUser = async (req, res) => {
  try {
    const user = await OrgUser.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOrgUserCountByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const uniqueEmails = await OrgUser.distinct("email", { organizationId: orgId });
    const count=uniqueEmails.length;
    res.status(200).json({ organizationId: orgId, userCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.uploadOrgUsersCSV = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }
  
      const { organizationId, assessmentId, emailSubject, emailMessage } = req.body;
      const URL=process.env.FRONTEND_URL
  
      if (!organizationId || !assessmentId || !emailSubject || !emailMessage) {
        return res.status(400).json({
          error: "organizationId, assessmentId, emailSubject, and emailMessage are required",
        });
      }
  
      const users = [];
      var response=false
  
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          const { Name, Email, Phone, ...rest } = row;
          console.log()
          const metadata = {};
          for (const key in rest) {
            if (rest[key] && rest[key].trim() !== "") {
              metadata[key] = rest[key];
            }
          }
  
          users.push({
            fullName:Name,
            email: Email,
            phone: Phone || "",
            metadata,
            organizationId,
            assessmentId,
          });
        })
        .on("end", async () => {
          try {
            const inserted = await OrgUser.insertMany(users);
            fs.unlinkSync(req.file.path);
  
            for (const user of inserted) {
              const personalizedText = emailMessage
                .replace("[Name]", user.fullName)
                .replace(
                  "[Assessment Link]",
                  `${URL}/test?organizationId=${user.organizationId}&orgUserId=${user._id}&assessmentId=${assessmentId}`
                );
            
              response=await Mailer(user.email, personalizedText, emailSubject);
            }
            if(response)return res
            .status(201)
            .json({ message: "Users uploaded and emails sent", users: inserted });
  
            

            return res.status(401).json({message:"Users uploaded but mail not send"})
          } catch (error) {
            console.error("Insertion or email error:", error.message);
            return res.status(500).json({ error: error.message });
          }
        });
    } catch (err) {
      console.error("Upload error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  };

  // const OrgUser = require("../models/orgUser");
  const AssessmentOutcome = require("../../assessment_v2/models/assessmentOutcome");
  
  exports.getOrgUsersByOrgAndAssessment = async (req, res) => {
    try {
      const { orgId, assessmentId } = req.params;
  
      const users = await OrgUser.find({ organizationId: orgId, assessmentId });
  
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          const outcome = await AssessmentOutcome.findOne({
            organizationId: orgId,
            assessmentId,
            userId: user._id,
          });
          console.log(user._id)
  
          let status = "Pending";
          let riskFactor = "Unknown";
          let outcomeId = null;
  
          if (outcome) {
            outcomeId = outcome._id;
            if (!outcome.results || outcome.results.length === 0) {
              status = "Completed";
              riskFactor = "None";
            } else {
              status = "Completed";
  
              // Determine highest severity
              const severities = outcome.results.map((r) => r.severity);
              if (severities.includes("Severe")) riskFactor = "Severe";
              else if (severities.includes("Moderate")) riskFactor = "Moderate";
              else if (severities.includes("Mild")) riskFactor = "Mild";
              else riskFactor = "None";
            }
          }
  
          return {
            ...user.toObject(),
            status,
            riskFactor,
            outcomeId,
          };
        })
      );
  
      res.status(200).json(enrichedUsers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };