const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post(
  "/google-login",
  () => {
    console.log("Hello, I am in Middleware");
  },
  userController.googleLogin
);
router.get("/verifyUsername/:userName", userController.checkUsername);

router.patch("/:id", authMiddleware.protect, userController.updateUser);
router.delete("/:id", authMiddleware.protect, userController.deleteUser);

router.get("/getUser", authMiddleware.protect, userController.getCurrentUser);

module.exports = router;
