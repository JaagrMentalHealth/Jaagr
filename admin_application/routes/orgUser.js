const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  createOrgUser,
  getOrgUsersByOrg,
  getOrgUserById,
  updateOrgUser,
  deleteOrgUser,
  uploadOrgUsersCSV,
  getOrgUserCountByOrg,
  getOrgUsersByOrgAndAssessment
} = require("../controllers/orgUserController");

// Standard CRUD
router.post("/", createOrgUser);
router.get("/organization/:orgId", getOrgUsersByOrg);
router.get("/count/:orgId",getOrgUserCountByOrg)
router.get("/:id", getOrgUserById);
router.put("/:id", updateOrgUser);
router.delete("/:id", deleteOrgUser);
router.get("/org/:orgId/assessment/:assessmentId", getOrgUsersByOrgAndAssessment);

// CSV Upload
router.post("/upload/csv", upload.single("file"), uploadOrgUsersCSV);

module.exports = router;
