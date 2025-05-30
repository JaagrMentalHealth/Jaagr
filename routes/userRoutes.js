const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/findByID/:id", userController.getFullName);
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post(
  "/google-login",
  (req, res, next) => {
    console.log(req.body.credential);
    next();
  },
  userController.googleLogin
);
router.get("/verifyUsername/:userName", userController.checkUsername);

router.patch("/:id", authMiddleware.protect, userController.updateUser);
router.delete("/:id", userController.deleteUser);

router.get("/getUser", authMiddleware.protect, userController.getCurrentUser);

router.get(
  "/change-password",
  authMiddleware.protect,
  userController.changePasswordRequest
);

router.post("/change-password", userController.changePassword);

router.post("/ghost-profile", userController.createGhostProfile);
router.get("/", userController.getAllUsersWithAssessment);

router.get("/:id", userController.getUserById);

module.exports = router;
