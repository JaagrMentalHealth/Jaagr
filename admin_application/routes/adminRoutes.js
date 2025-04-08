const express = require("express");
const {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getMyProfile,
} = require("../controllers/adminController");
const protect = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post(
  "/create",
  protect,
  roleMiddleware(["master_admin", "super_admin"]),
  createAdmin
);

router.get("/me", protect, getMyProfile); // 👈 Add this route

router.put("/update", protect, updateAdmin);

router.delete(
  "/:id",
  protect,
  roleMiddleware(["master_admin", "super_admin"]),
  deleteAdmin
);

module.exports = router;
