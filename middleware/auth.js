// authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Blog = require("../models/Blog");

exports.protect = async (req, res, next) => {
  // console.log("Middleware");
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // console.log(token);

    if (!token) {
      return res.status(401).json({
        message: "You are not logged in! Please log in to get access.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    const currentUser = await User.findOne({ userName: decoded.id });

    if (!currentUser) {
      return res.status(401).json({
        message: "The user belonging to this token no longer exists.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid token. Please log in again!" });
  }
};

exports.restrictToAuthor = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "No blog found with that slug" });
    }
    const user = await User.findById(blog.author);

    if (user.userName !== req.user.userName) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
