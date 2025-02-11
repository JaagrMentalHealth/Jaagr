const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { Mailer } = require("../utils/mailer");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      bio: req.body.bio,
    });

    const token = signToken(newUser.userName);

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      res.status(400).json({
        status: "fail",
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists. Please choose a different one.`,
      });
    } else {
      res.status(400).json({
        status: "fail",
        message: err.message,
      });
    }
  }
};

exports.googleLogin = async (req, res) => {
  // console.log("Into controller");
  try {
    const { credential } = req.body;
    console.log(credential);
    if (!credential) {
      return res
        .status(400)
        .json({ status: "error", message: "Credential is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google token");
    }
    // console.log("recieved payload");

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create a new user if not found
      user = await User.create({
        email,
        fullName: name,
        profilePhoto: picture,
        googleId,
        userName: email.split("@")[0], // Use email prefix as username
      });
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, update it
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ id: user.userName }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(400).json({
      status: "error",
      message: error.message || "An error occurred during Google login",
    });
  }
};

exports.getFullName = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User Not Found",
      });
    }
    res.status(200).json({
      status: "success",
      fullName: user.fullName,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  console.log("Hi");
  try {
    const user = await User.findOne({ userName: req.user.userName })
      .populate("blogs likedBlogs savedBlogs history")
      .populate("history.author");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.checkUsername = async (req, res) => {
  try {
    const { userName } = req.params;
    const exists = await User.exists({ userName });

    res.status(200).json({
      status: "success",
      exists: !!exists,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password!" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }
    // console.log(user)
    const token = signToken(user.userName);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "blogs likedBlogs savedBlogs history"
    );
    if (!user) {
      return res.status(404).json({ message: "No user found with that ID" });
    }
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Function to check uniqueness
    const checkUniqueness = async (field, value) => {
      if (field === "userName" || field === "email") {
        const existingUser = await User.findOne({ [field]: value });
        if (existingUser && existingUser._id.toString() !== id) {
          throw new Error(
            `${
              field === "userName" ? "Username" : "Email"
            } already exists. Please choose a different one.`
          );
        }
      }
    };

    // Check uniqueness for all fields being updated
    for (const [field, value] of Object.entries(updates)) {
      await checkUniqueness(field, value);
    }

    // Update the user
    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res
        .status()
        .json({ status: "fail", message: "No user found with that ID" });
    }

    return res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "No user found with that ID" });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.changePasswordRequest = async (req, res) => {
  try {
    const user = req.user;
    const url = req.get("Referer") || req.get("Origin");

    // Hash the user's _id
    const hashedId = await bcrypt.hash(user._id.toString(), 10);
    const baseUrl = url;
    // Append the hashed ID to the URL as a parameter
    const changePasswordUrl = `${baseUrl}/change-password?id=${encodeURIComponent(
      hashedId
    )}`;
    const emailMessage = `Password Changing Link ${changePasswordUrl}`;
    await Mailer(user.email, emailMessage, "Password Change URL");

    console.log(changePasswordUrl.toString(), user.email);
    res.status(200).json({ message: "Email Sent" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { hashedUserId, newPassword } = req.body;
    // console.log(req.body);
    if (!hashedUserId || !newPassword) {
      return;
      res
        .status(404)
        .json({ message: "Please Enter the password and the hashed ID" });
    }
    // Retrieve all users to compare the hashedUserId
    const users = await User.find();
    let user = null;

    // Find the user by comparing the hashed ID
    for (const u of users) {
      const isMatch = await bcrypt.compare(u._id.toString(), hashedUserId);
      // console.log(isMatch);
      if (isMatch) {
        user = u;
        break;
      }
    }

    // If no user matches, return error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    // const saltRounds = 10;
    console.log(user);

    // Update password in database
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
