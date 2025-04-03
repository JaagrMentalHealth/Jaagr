const csv = require("csv-parser");
const OrgUser = require("../models/orgUser");
const fs=require("fs")
const {Mailer}=require("../../utils/mailer")

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


exports.uploadOrgUsersCSV = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }
  
      const { organizationId, assessmentId, emailSubject, emailMessage } = req.body;
  
      if (!organizationId || !assessmentId || !emailSubject || !emailMessage) {
        return res.status(400).json({
          error: "organizationId, assessmentId, emailSubject, and emailMessage are required",
        });
      }
  
      const users = [];
  
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
                .replace("[Assessment Link]", `https://yourapp.com/assessment/${assessmentId}?user=${user._id}`);
  
              await Mailer(user.email, personalizedText, emailSubject);
            }
  
            return res
              .status(201)
              .json({ message: "Users uploaded and emails sent", users: inserted });
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