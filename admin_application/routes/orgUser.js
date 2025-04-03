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
  uploadOrgUsersCSV
} = require("../controllers/orgUserController");

// Standard CRUD
router.post("/", createOrgUser);
router.get("/organization/:orgId", getOrgUsersByOrg);
router.get("/:id", getOrgUserById);
router.put("/:id", updateOrgUser);
router.delete("/:id", deleteOrgUser);

// CSV Upload
router.post("/upload/csv", upload.single("file"), uploadOrgUsersCSV);

module.exports = router;
